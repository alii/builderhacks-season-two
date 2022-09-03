import {InferAPIResponse} from 'nextkit';
import useSWR from 'swr';

export function useQuery<T>(path: `/api/${string}`) {
	return useSWR<InferAPIResponse<T, 'GET'>, Error>(path);
}
