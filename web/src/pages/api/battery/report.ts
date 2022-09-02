import {NextkitError} from 'nextkit';
import {z} from 'zod';
import {api} from '../../../server/nextkit';
import {isValidPair} from '../../../utils/pairs';
import {percentage} from '../../../utils/schemas';

const schema = z.object({
	percentage: percentage(),
});

export default api({
	async POST({req, ctx}) {
		const token = await ctx.getToken();
		const talkingTo = await ctx.talkingTo.get(token.id);
		const body = schema.parse(req.body);

		if (!talkingTo) {
			throw new NextkitError(400, 'You are not in a conversation right now!');
		}

		if (
			!isValidPair(
				{
					token: talkingTo,
					percentage: await ctx.utils.hop.getTokenBatteryPercentage(talkingTo),
				},
				{
					token: token.id,
					percentage: body.percentage,
				},
			)
		) {
			await ctx.utils.hop.publishDirectMessage(
				talkingTo,
				'PAIR_BATTERY_INVALID',
				null,
			);

			await ctx.utils.hop.publishDirectMessage(
				token.id,
				'PAIR_BATTERY_INVALID',
				null,
			);

			return;
		}

		await ctx.utils.hop.publishDirectMessage(
			talkingTo,
			'PARTNER_BATTERY_UPDATE',
			body.percentage,
		);
	},
});
