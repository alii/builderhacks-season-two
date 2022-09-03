import 'tailwindcss/tailwind.css';

import {hop} from '@onehop/client';
import {AppProps} from 'next/app';
import {useEffect} from 'react';
import {SWRConfig, SWRConfiguration} from 'swr';
import {fetcher} from '../client/fetcher';
import {useQuery} from '../hooks/query';
import type LeapAPI from './api/leap';

function App({Component, pageProps}: AppProps) {
	const {data: token} = useQuery<typeof LeapAPI>('/api/leap');

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		if (!token) {
			return;
		}

		hop.init({
			projectId: process.env.NEXT_PUBLIC_HOP_PROJECT_ID!,
			token: token.id,
		});
	}, [token]);

	return <Component {...pageProps} />;
}

const config: SWRConfiguration = {
	fetcher,
};

export default function Wrapper(props: AppProps) {
	return (
		<SWRConfig value={config}>
			<App {...props} />
		</SWRConfig>
	);
}
