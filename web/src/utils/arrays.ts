/**
 * Pick a random element from an array.
 * @param array An array of items to choose from.
 * @returns A random element from the array.
 */
export function random<T>(array: T[]) {
	return array[Math.floor(Math.random() * array.length)];
}

export function chunk<T>(arr: T[], len: number): T[][] {
	const chunks: T[][] = [];
	let i = 0;

	while (i < arr.length) {
		chunks.push(arr.slice(i, (i += len)));
	}

	return chunks;
}
