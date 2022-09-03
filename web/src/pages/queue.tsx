import {
	ConnectionState,
	useConnectionState,
	useDirectMessage,
} from '@onehop/react';
import {useRouter} from 'next/router';

import {ChannelEvents} from 'types';

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
		return <p>{connectionState}</p>;
	}

	return <div>Finding you a match...</div>;
}
