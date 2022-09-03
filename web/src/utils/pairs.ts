import {env} from '../server/env';

export function isValidPair(a: QueueMember, b: QueueMember): boolean {
	const isValid = Math.abs(a.percentage - b.percentage) < env.PERCENTAGE_RANGE;
	console.log('isValidPair', a.percentage, b.percentage, isValid);
	return isValid;
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
		console.log('Got closest pair: ', pair);

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
	console.log('trio sorted: ', [lower, mid, higher]);
	if (mid.percentage - lower.percentage < higher.percentage - mid.percentage) {
		console.log('lower is closer, checking if valid');
		return isValidPair(lower, mid) ? [lower, mid] : undefined;
	} else {
		console.log('higher is closer, checking if valid');
		return isValidPair(mid, higher) ? [lower, mid] : undefined;
	}
}
