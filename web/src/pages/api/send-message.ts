import {NextkitError} from 'nextkit';
import {z} from 'zod';
import {api} from '../../server/nextkit';

const schema = z.object({
	content: z.string().min(0).max(240),
});

export default api({
	async POST({req, ctx}) {
		console.log('Received a message to send.');
		const token = await ctx.getToken();
		const body = schema.parse(req.body);

		const talkingTo = await ctx.talkingTo.get(token.id);
		console.log('Figured out who we are talking to.');

		if (!talkingTo) {
			throw new NextkitError(400, 'You are not talking to anyone');
		}

		console.log(
			'Sending message to ',
			talkingTo,
			' with content ',
			body.content,
		);

		await ctx.utils.hop.publishDirectMessage(talkingTo, 'CHAT_EVENT', {
			type: 'user',
			content: body.content,
			author: 'lmfao',
		});

		console.log('finished sending message');
	},
});
