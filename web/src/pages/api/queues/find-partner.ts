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

			// TODO: Find match
			const channel = await ctx.hop.channels.create(ChannelType.PRIVATE);

			await channel.subscribeTokens([]);
		}

		//
	},
});

type queueMember = {token: `leap_token_${string}`; percentage: number};

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
