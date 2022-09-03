import {hop} from '@onehop/client';
import {AppProps} from 'next/app';
import {useEffect} from 'react';
import 'tailwindcss/tailwind.css';

export default function App({Component, pageProps}: AppProps) {
	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		hop.init({
			projectId: process.env.NEXT_PUBLIC_HOP_PROJECT_ID!,
		});
	}, []);

	return <Component {...pageProps} />;
}
