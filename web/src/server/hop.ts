import {API, Hop, Id} from '@onehop/js';
import {ChannelEvents} from 'types';
import {env} from './env';

export const hop = new Hop(env.HOP_API_TOKEN);

export function publishDirectMessage<
	Event extends string & keyof ChannelEvents,
>(token: Id<'leap_token'>, event: Event, data: ChannelEvents[Event]) {
	return hop.channels.tokens.publishDirectMessage(token, event, data);
}

export function publishMessage<Event extends string & keyof ChannelEvents>(
	channel: API.Channels.Channel['id'],
	event: Event,
	data: ChannelEvents[Event],
) {
	return hop.channels.publishMessage(channel, event, data);
}
