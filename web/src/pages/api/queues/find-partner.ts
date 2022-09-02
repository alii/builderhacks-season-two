import {api} from '../../../server/nextkit';
import {z} from 'zod';
import {env} from '../../../server/env';
import {NextkitError} from 'nextkit';
import {random} from '../../../utils/arrays';
import {ChannelEvents} from 'types';
import {ChannelType} from '@onehop/js';

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

			// TODO: Find match

			const channel = await ctx.hop.channels.create(ChannelType.PRIVATE);

			await ctx.utils.hop.publishDirectMessage(match, 'PARTNER_FOUND');
		}

		//
	},
});
