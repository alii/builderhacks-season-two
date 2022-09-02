import {z} from 'zod';

export function percentage() {
	return z.number().min(0).max(100);
}
