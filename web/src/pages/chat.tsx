import {useState} from 'react';
import {fetcher} from '../client/fetcher';
import {useDirectMessage} from '@onehop/react';
import {useQuery} from '../hooks/query';
import LeapAPI from './api/leap';

export default function Chat() {
	const {data: token} = useQuery<typeof LeapAPI>('/api/leap');
	const [message, setMessage] = useState('');
	const [messages, setMessages] = useState<string[]>([]);

	const user_token = token?.id || '';
	console.log('receiving messages as token: ', user_token);

	useDirectMessage('CHAT_EVENT', msg => {
		console.log('Received message: ', msg);
		setMessages([...messages, msg.content]);
	});

	return (
		<div className={'p-3'}>
			<div>
				<input
					type="text"
					value={message}
					placeholder="Message"
					onChange={e => setMessage(e.target.value)}
				/>

				<button
					type="button"
					onClick={async e => {
						e.preventDefault();

						await fetcher('/api/send-message', {
							method: 'POST',
							body: {content: message},
						});
					}}
				>
					send
				</button>
			</div>
			<div>
				{messages.map((message, index) => (
					<div key={index}>{message}</div>
				))}
			</div>
		</div>
	);
}
