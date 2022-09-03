import {
	ConnectionState,
	useConnectionState,
	useDirectMessage,
} from '@onehop/react';
import {useRouter} from 'next/router';

import {ChannelEvents} from 'types';

const defaultLayout = (state: JSX.Element) => (
	<div className={'p-3'}>
		<h1 className={'font-bold'}>Queue tings and that</h1>
		{state}
		<div className={'mt-3'}>
			<a href={'/'}>Leave Queue</a>
		</div>
	</div>
);

export default function QueuePage() {
	const connectionState = useConnectionState();
	const router = useRouter();

	useDirectMessage<ChannelEvents['PARTNER_FOUND']>(
		'PARTNER_FOUND',
		async () => {
			await router.push('/chat');
		},
	);

	if (connectionState !== ConnectionState.CONNECTED) {
		return defaultLayout(<p>{connectionState}</p>);
	}

	return defaultLayout(<div>Finding you a match...</div>);
}
