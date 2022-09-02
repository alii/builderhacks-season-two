import {api} from '../../../server/nextkit';
import {z} from 'zod';
import {env} from '../../../server/env';
import {NextkitError} from 'nextkit';

const schema = z.object({
	secret: z.string(),
});

export default api({
	async POST({req}) {
		const {secret} = schema.parse(req.body);

		if (secret !== env.QUEUE_SECRET) {
			throw new NextkitError(401, 'Invalid secret');
		}

		// TODO: Find all users who can match at this point
	},
});
