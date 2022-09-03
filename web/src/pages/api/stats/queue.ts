import {api} from '../../../server/nextkit';

export default api({
	async GET({ctx}) {
		const total = await ctx.redis.client.zcount(
			ctx.redis.keys.FindPartnerQueue,
			'-inf',
			'+inf',
		);

		const queue = await ctx.redis.getFindPartnerQueue();

		return {
			total,
			queue,
		};
	},
});
