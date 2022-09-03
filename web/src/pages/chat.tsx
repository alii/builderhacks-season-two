import {useState} from 'react';
import {fetcher} from '../client/fetcher';
import {useDirectMessage} from '@onehop/react';
import {Message} from 'types';

export default function Chat() {
	const [newMessage, setNewMessage] = useState('');
	const [messages, setMessages] = useState<Message[]>([]);

	useDirectMessage<Message>('CHAT_EVENT', msg => {
		console.log('Received message: ', msg);

		setMessages(messages => [
			...messages,
			{author: 'other person', content: msg.content},
		]);
	});

	async function sendMessage() {
		setMessages(messages => [
			...messages,
			{author: 'you', content: newMessage},
		]);

		await fetcher('/api/send-message', {
			method: 'POST',
			body: {content: newMessage},
		});
	}

	return (
		<div className={'p-3'}>
			<div>
				<input
					type="text"
					value={newMessage}
					placeholder="Message"
					onChange={e => setNewMessage(e.target.value)}
				/>

				<button
					type="button"
					onClick={async e => {
						e.preventDefault();
						sendMessage().catch(console.error);
					}}
				>
					send
				</button>
			</div>
			<div className={'mt-2'}>
				{messages.length > 0 ? (
					<div>
						<p className={'font-bold'}>Messages:</p>
						{messages.map((message, index) => (
							<div key={index} className={'flex'}>
								<p className={'inline-block font-semibold'}>
									{message.author}
									{':'}
								</p>
								<p className={'inline-block ml-1'}>{message.content}</p>
							</div>
						))}
					</div>
				) : (
					<p>No messages yet</p>
				)}
			</div>
		</div>
	);
}
