export interface ChannelEvents {
	/**
	 * Emitted when you have found a partner
	 */
	PARTNER_FOUND: {};

	/**
	 * Emitted when your partner has updated their battery percentage
	 */
	PARTNER_BATTERY_UPDATE: number;

	/**
	 * Emitted when a pair's battery percentages become invalid
	 */
	PAIR_BATTERY_INVALID: null;

	CHAT_EVENT:
		| {
				type: 'user';
				content: string;
				author: string;
		  }
		| {
				type: 'system';
				content: string;
		  };
}

export type Message = Omit<
	Extract<ChannelEvents['CHAT_EVENT'], {type: 'user'}>,
	'type'
>;
