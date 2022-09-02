import {api} from '../../../server/nextkit';
import {z} from 'zod';
import {env} from '../../../server/env';
import {NextkitError} from 'nextkit';
import {ChannelType} from '@onehop/js';

const PERCENTAGE_RANGE = 5;

const schema = z
	.object({
		type: z.literal('invocate'),
		secret: z.string(),
	})
	.or(
		z.object({
			type: z.enum(['enqueue', 'dequeue']),
		}),
	);

export default api({
	async GET({ctx}) {
		return ctx.redis.getFindPartnerQueue();
	},

	async POST({req, ctx}) {
		const body = schema.parse(req.body);

		if (body.type === 'invocate') {
			if (body.secret !== env.QUEUE_SECRET) {
				throw new NextkitError(401, 'Invalid secret');
			}

			const tokens = await ctx.redis.getFindPartnerQueue();

			const sorted = tokens.sort((a, b) => b.percentage - a.percentage);

			// TODO: loop through, find pair, remove from queue, start again until no more pairs, been more than 5 seconds, or queue is empty
			const start = Date.now();
			while (Date.now() - start < 5000 && sorted.length > 2) {
				const pair = getAPair(sorted);

				if (pair !== undefined) {
					// TODO: remove from redis queue

					// TODO: start a channel, put users in and force them to be friends
					const channel = await ctx.hop.channels.create(ChannelType.PRIVATE);
					await channel.subscribeTokens(pair.map(p => p.token));
					// I think this is how this works but idk lol

					pair.forEach(member => {
						sorted.splice(sorted.indexOf(member), 1);
					});
				}
			}
			console.log(
				`Ran through queue enough times for this request due to ${
					sorted.length > 2 ? 'time expiring' : 'not enough members in queue'
				}, returning`,
			);

			return;
		}

		if (body.type === 'enqueue') {
			return;
		}

		if (body.type === 'dequeue') {
			return;
		}
	},
});

type queueMember = {token: `leap_token_${string}`; percentage: number};

function getAPair(arr: queueMember[]): [queueMember, queueMember] | undefined {
	if (arr.length < 2) {
		console.log('Queue length is less than 2, returning undefined');
		return undefined;
	}

	if (arr.length === 2) {
		console.log('Queue length is 2, returning pair if valid');
		return isValidPair(arr[0], arr[1]) ? [arr[0], arr[1]] : undefined;
	}

	for (let i = 1; i < arr.length - 1; i++) {
		const pair = getClosest(arr[0], arr[i], arr[i + 1]);
		if (pair !== undefined) {
			console.log('Found pair within queue:', pair);
			return pair;
		}
	}

	const [lower, mid, higher] = arr;

	return getClosest(lower, mid, higher);
}

function getClosest(
	lower: queueMember,
	mid: queueMember,
	higher: queueMember,
): [queueMember, queueMember] | undefined {
	if (mid.percentage - lower.percentage < higher.percentage - mid.percentage) {
		return isValidPair(lower, mid) ? [lower, mid] : undefined;
	} else {
		return isValidPair(mid, higher) ? [lower, mid] : undefined;
	}
}

function isValidPair(a: queueMember, b: queueMember) {
	return Math.abs(a.percentage - b.percentage) < PERCENTAGE_RANGE;
}
