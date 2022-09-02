import {Id, validateId} from '@onehop/js';
import createAPI, {NextkitError} from 'nextkit';
import {chunk} from '../utils/arrays';
import {hop, publishDirectMessage, publishMessage} from './hop';
import {redis} from './redis';

export enum RedisKeys {
	FindPartnerQueue = 'find-partner-queue',
}

export const api = createAPI({
	async getContext(req) {
		return {
			hop,

			utils: {
				hop: {
					publishMessage,
					publishDirectMessage,
				},
			},

			getLeapToken() {
				const token = req.headers.authorization;

				if (!token) {
					throw new Error('You have not authorized!');
				}

				if (!validateId(token, 'leap_token')) {
					throw new NextkitError(401, 'Invalid leap token');
				}

				return token;
			},

			redis: {
				client: redis,
				keys: RedisKeys,

				async findPartnerByPercentage(percentage: number) {
					const result = await redis.zrange<Array<Id<'leap_token'>>>(
						RedisKeys.FindPartnerQueue,
						percentage - 5,
						percentage + 5,
					);

					// Sorted set doesn't exist, so just return []
					// as there is no need to initialise it here
					if (!result) {
						return [];
					}

					return result;
				},

				async getFindPartnerQueue() {
					const range = await redis.zrange<Array<Id<'leap_token'> | number>>(
						RedisKeys.FindPartnerQueue,
						0,
						-1,
						{withScores: true},
					);

					const entries = chunk(range, 2) as Array<[Id<'leap_token'>, number]>;

					return entries.map(([token, percentage]) => {
						return {
							token,
							percentage,
						};
					});
				},

				async addLeapTokenToFindPartnerQueue(
					token: Id<'leap_token'>,
					percentage: number,
				) {
					await redis.zadd(RedisKeys.FindPartnerQueue, {
						member: token,
						score: percentage,
					});
				},
			},
		};
	},

	async onError(req, res, error) {
		return {
			status: 500,
			message: error.message,
		};
	},
});
