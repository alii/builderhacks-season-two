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

			const sorted = tokens.sort((a, b) => b.percentage - a.percentage);

			const pair = getAPair(sorted);
			console.log('Pair returned from get a pair:', pair);

			// Looping through sorted tokens to find pair with closest percentage

			const channel = await ctx.hop.channels.create(ChannelType.PRIVATE);

			await channel.subscribeTokens([]);

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
		return undefined;
	}

	for (let i = 1; i < arr.length; i++) {
		const pair = getClosest(arr[0], arr[i], arr[i + 1]);

		if (pair !== undefined) {
			console.log('Found pair:', pair);
			return pair;
		}
	}

	const [lower, mid, higher] = arr;

	return getClosest(lower, mid, higher);
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
