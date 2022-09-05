import {NextApiRequest, NextApiResponse} from 'next';
import {env} from '../../../server/env';
import {queue} from '../../../server/lowcake';
import {getContext} from '../../../server/nextkit';
import {getAPair} from '../../../utils/pairs';

const run = queue(
	env.LOWCAKE_QUEUE_ID,
	{
		url: 'https://staywithme.hop.sh/api/lowcake/find-partner',
		retry: [],
		exclusive: true,
		schedule: {
			type: 'every',
			meta: (5 * 1000).toString(),
		},
	},
	async (payload, req, res) => {
		const ctx = await getContext(req, res);

		const tokens = await ctx.redis.getFindPartnerQueue();
		console.log('Found tokens in the queue: ', tokens);

		// randomly switch between sorting from low to high and high to low so that users at one end don't get screwed with loading times
		const sorted = tokens.sort((a, b) =>
			Math.floor(Math.random() * 2) === 1
				? b.percentage - a.percentage
				: a.percentage - b.percentage,
		);

		console.log('Sorting through queue members');
		for (let loops = 0; loops < Math.min(sorted.length - 1, 10); loops++) {
			if (sorted.length < 2) {
				break;
			}

			const pair = getAPair(sorted);
			console.log(
				pair === undefined
					? 'no pairs found in queue'
					: 'Found a pair within queue: ',
				pair,
			);

			if (!pair) {
				continue;
			}

			await ctx.redis.removePairFromPartnerQueue(pair[0].token, pair[1].token);
			console.log('Removed pair from queue');

			await ctx.talkingTo.set(pair[0].token, pair[1].token);
			console.log('Set talkingTo for both users');

			// TODO - remove try catch when finished testing
			for (const {token} of pair) {
				await ctx.utils.hop.publishDirectMessage(token, 'PARTNER_FOUND', {});
			}
			console.log('Sent partner found messages to both users through hop');

			// I think this is how this works but idk lol
			pair.forEach(member => {
				sorted.splice(sorted.indexOf(member), 1);
			});
			console.log('Removed pair from sorted array');
		}

		console.log(
			`Ran through queue enough times for this request due to ${
				sorted.length > 2 ? 'loops expiring' : 'not enough members in queue'
			}, returning`,
		);

		return;
	},
);

export default (req: NextApiRequest, res: NextApiResponse) => {
	console.log(req.body);
	return run(req, res);
};
