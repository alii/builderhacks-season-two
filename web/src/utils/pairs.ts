import {env} from '../server/env';
import type {QueueMember} from '../pages/api/queues/find-partner';

export function isValidPair(a: QueueMember, b: QueueMember) {
	return Math.abs(a.percentage - b.percentage) < env.PERCENTAGE_RANGE;
}
