import {api} from '../../../server/nextkit';
import {z} from 'zod';
import {env} from '../../../server/env';
import {NextkitError} from 'nextkit';
import {ChannelType} from '@onehop/js';
import urlcat from 'es-urlcat';

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

		if (body.type === 'invocate') {
			if (body.secret !== env.QUEUE_SECRET) {
				throw new NextkitError(401, 'Invalid secret');
			}

			const tokens = await ctx.redis.getFindPartnerQueue();

			// randomly switch between sorting from low to high and high to low so that users at one end don't get screwed with loading times
			const sorted = tokens.sort((a, b) =>
				Math.floor(Math.random() * 2) === 1
					? b.percentage - a.percentage
					: a.percentage - b.percentage,
			);

			for (let loops = 0; loops < Math.min(sorted.length - 1, 10); loops++) {
				if (sorted.length < 2) {
					break;
				}

				const pair = getAPair(sorted);

				if (pair !== undefined) {
					// TODO: remove from redis queue

					const channel = await ctx.hop.channels.create(ChannelType.PRIVATE);
					await channel.subscribeTokens(pair.map(p => p.token));
					console.log('Created channel:', channel.id, 'with users: ', pair);
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

type QueueMember = {token: `leap_token_${string}`; percentage: number};

function getAPair(arr: QueueMember[]): [QueueMember, QueueMember] | undefined {
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
}

function getClosest(
	lower: QueueMember,
	mid: QueueMember,
	higher: QueueMember,
): [QueueMember, QueueMember] | undefined {
	if (mid.percentage - lower.percentage < higher.percentage - mid.percentage) {
		return isValidPair(lower, mid) ? [lower, mid] : undefined;
	} else {
		return isValidPair(mid, higher) ? [lower, mid] : undefined;
	}
}

function isValidPair(a: QueueMember, b: QueueMember) {
	return Math.abs(a.percentage - b.percentage) < env.PERCENTAGE_RANGE;
}
