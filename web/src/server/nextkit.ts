import {Id, validateId} from '@onehop/js';
import {NextkitError, default as createAPI} from 'nextkit';
import {chunk} from '../utils/arrays';
import {hop, publishDirectMessage, publishMessage} from './hop';
import {lowcake} from './lowcake';
import {redis} from './redis';
import {serialize} from 'cookie';
import {z} from 'zod';

export const RedisKeys = {
	FindPartnerQueue: 'find-partner-queue',
	TalkingTo: (id: Id<'leap_token'>) => `talking-to:${id}`,
};

export const api = createAPI({
	async getContext(req, res) {
		return {
			hop,
			lowcake,

			talkingTo: {
				async set(token: Id<'leap_token'>, talkingTo: Id<'leap_token'>) {
					await redis.set(RedisKeys.TalkingTo(token), talkingTo, {
						// Session is probably gone by then
						ex: 60 * 60 * 24 * 7,
					});

					await redis.set(RedisKeys.TalkingTo(talkingTo), token, {
						// Session is probably gone by then
						ex: 60 * 60 * 24 * 7,
					});
				},

				async get(token: Id<'leap_token'>) {
					return redis.get<Id<'leap_token'>>(RedisKeys.TalkingTo(token));
				},

				async remove(token: Id<'leap_token'>, talkingTo: Id<'leap_token'>) {
					await redis.del(RedisKeys.TalkingTo(token));
					await redis.del(RedisKeys.TalkingTo(talkingTo));
				},
			},

			async createSession(percentage: number) {
				const token = await hop.channels.tokens.create({});

				res.setHeader(
					'Set-Cookie',
					serialize('session', token.id, {
						httpOnly: true,
						path: '/',
						secure: true,
						sameSite: req.headers.host === 'localhost:3000' ? 'none' : 'strict',
					}),
				);

				await redis.zadd(RedisKeys.FindPartnerQueue, {
					member: token.id,
					score: percentage,
				});
			},

			async getToken() {
				const {session: token} = req.cookies;

				if (!token) {
					throw new NextkitError(401, 'Missing session');
				}

				if (!validateId(token, 'leap_token')) {
					throw new NextkitError(401, 'Invalid session');
				}

				return hop.channels.tokens.get(token);
			},

			utils: {
				hop: {
					publishMessage,
					publishDirectMessage,

					async getTokenBatteryPercentage(token: Id<'leap_token'>) {
						const {state} = await hop.channels.tokens.get(token);

						return state.lastKnownBattery as number;
					},

					async setTokenBatteryPercentage(
						token: Id<'leap_token'>,
						percentage: number,
					) {
						await hop.channels.tokens.setState(token, {
							lastKnownBattery: percentage,
						});
					},
				},
			},

			redis: {
				client: redis,
				keys: RedisKeys,

				async removePairFromPartnerQueue(
					token: Id<'leap_token'>,
					talkingTo: Id<'leap_token'>,
				) {
					await redis.zrem(RedisKeys.FindPartnerQueue, token, talkingTo);
				},

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
		if (error instanceof z.ZodError) {
			return {
				status: 400,
				message: error.message,
			};
		}

		return {
			status: 500,
			message: error.message,
		};
	},
});
