import {api} from '../../../server/nextkit';
import {z} from 'zod';
import {env} from '../../../server/env';
import {NextkitError} from 'nextkit';
import urlcat from 'es-urlcat';
import {getAPair} from '../../../utils/pairs';

const schema = z
	.object({
		type: z.literal('invocate'),
		secret: z.string(),
	})
	.or(
		z.object({
			type: z.literal('dequeue'),
			job: z.string(),
		}),
	)
	.or(
		z.object({
			type: z.literal('enqueue'),
		}),
	);

type EnqueuePayload = Extract<z.infer<typeof schema>, {type: 'invocate'}>;

export default api({
	async GET({ctx, req}) {
		return ctx.redis.getFindPartnerQueue();
	},

	async POST({req, ctx}) {
		const body = schema.parse(req.body);
		console.log('Received a call to find partners in the queue.');

		if (
			(body.type === 'invocate' && body.secret !== env.QUEUE_SECRET) ||
			(body.type !== 'invocate' &&
				req.headers.authorization !== env.QUEUE_SECRET)
		) {
			throw new NextkitError(401, 'Invalid secret');
		}
		console.log('Secret is valid, continuing to find partners.');

		if (body.type === 'invocate') {
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

				await ctx.redis.removePairFromPartnerQueue(
					pair[0].token,
					pair[1].token,
				);
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
		}

		if (body.type === 'enqueue') {
			const protocol = req.headers.host === 'localhost:3000' ? 'http' : 'https';

			if (!req.url) {
				throw new NextkitError(500, 'Missing url');
			}

			const payload: EnqueuePayload = {
				type: 'invocate',
				secret: env.QUEUE_SECRET,
			};

			const {id} = await ctx.lowcake.enqueue(env.LOWCAKE_QUEUE_ID, {
				url: urlcat(`${protocol}://${req.headers.host}`, req.url),
				payload,
				retry: [],
				exclusive: true,
				schedule: {
					type: 'every',
					meta: (5 * 1000).toString(),
				},
			});

			return id;
		}

		await ctx.lowcake.dequeue(env.LOWCAKE_QUEUE_ID, body.job);
	},
});
