import {APIResponse, ErroredAPIResponse} from 'nextkit';

export class FetcherError extends Error {
	constructor(
		public readonly request: Request,
		public readonly response: Response,
		public readonly data: ErroredAPIResponse,
	) {
		super(data.message);
	}
}

export async function fetcher<T>(url: string, init?: RequestInit) {
	const request = new Request(url, init);
	const response = await fetch(request);
	const json = (await response.json()) as APIResponse<T>;

	if (!json.success) {
		throw new FetcherError(request, response, json);
	}

	return json.data;
}
