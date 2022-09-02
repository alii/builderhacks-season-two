import {env} from '../server/env';

export function isValidPair(a: QueueMember, b: QueueMember) {
	return Math.abs(a.percentage - b.percentage) < env.PERCENTAGE_RANGE;
}

export type QueueMember = {token: `leap_token_${string}`; percentage: number};

export function getAPair(
	arr: QueueMember[],
): [QueueMember, QueueMember] | undefined {
	if (arr.length < 2) {
		console.log('Queue length is less than 2, returning undefined');
		return undefined;
	}

	if (arr.length === 2) {
		console.log('Queue length is 2, returning pair if valid');
		return isValidPair(arr[0], arr[1]) ? [arr[0], arr[1]] : undefined;
	}

	for (let i = 1; i < arr.length - 1; i++) {
		const pair = getClosest(arr[0], arr[i], arr[i + 1]);

		if (pair !== undefined) {
			console.log('Found pair within queue:', pair);
			return pair;
		}
	}
}

export function getClosest(
	lower: QueueMember,
	mid: QueueMember,
	higher: QueueMember,
): [QueueMember, QueueMember] | undefined {
	if (mid.percentage - lower.percentage < higher.percentage - mid.percentage) {
		return isValidPair(lower, mid) ? [lower, mid] : undefined;
	} else {
		return isValidPair(mid, higher) ? [lower, mid] : undefined;
	}
}
