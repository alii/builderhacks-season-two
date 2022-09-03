import {z} from 'zod';
import {api} from '../../../server/nextkit';
import {percentage} from '../../../utils/schemas';

const schema = z.object({
	percentage: percentage(),
});

export default api({
	async POST({ctx, req}) {
		const body = schema.parse(req.body);
		await ctx.createSession(body.percentage);

		return {
			_redirect: '/queue',
		};
	},
});
