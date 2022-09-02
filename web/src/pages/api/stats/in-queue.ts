import {api} from '../../../server/nextkit';

export default api({
	async GET({ctx}) {
		return ctx.redis.client.zcount(
			ctx.redis.keys.FindPartnerQueue,
			'-inf',
			'+inf',
		);
	},
});
