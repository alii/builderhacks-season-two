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

			const pair = getAPair(sorted);
			console.log('Pair returned from get a pair:', pair);

			// Looping through sorted tokens to find pair with closest percentage

			const channel = await ctx.hop.channels.create(ChannelType.PRIVATE);

			await channel.subscribeTokens([]);

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
