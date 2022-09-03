import {InferAPIResponse} from 'nextkit';
import {default as useSWR} from 'swr';

export function useQuery<T>(path: `/api/${string}`) {
	return useSWR<InferAPIResponse<T, 'GET'>, Error>(path);
}
