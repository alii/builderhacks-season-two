import {z} from 'zod';
import {api} from '../../../server/nextkit';
import {percentage} from '../../../utils/schemas';

const schema = z.object({
	percentage: percentage(),
});

export default api({
	async POST({req, ctx}) {
		const token = await ctx.getToken();
	},
});
