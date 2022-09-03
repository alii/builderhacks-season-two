import {z} from 'zod';

export function numberResolvable(numberSchema: z.ZodNumber = z.number()) {
	return numberSchema.or(
		z.string().transform(value => numberSchema.parse(parseFloat(value))),
	);
}

export function percentage() {
	return numberResolvable(z.number().min(0).max(100));
}
