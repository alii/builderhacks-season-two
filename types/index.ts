export interface ChannelEvents {
	/**
	 * Emitted when you have found a partner
	 */
	PARTNER_FOUND: null;

	/**
	 * Emitted when your partner has updated their battery percentage
	 */
	PARTNER_BATTERY_UPDATE: number;

	/**
	 * Emitted when a pair's battery percentages become invalid
	 */
	PAIR_BATTERY_INVALID: null;
}
