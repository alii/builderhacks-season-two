import {useState} from 'react';
import {fetcher} from '../client/fetcher';

export default function Chat() {
	const [message, setMessage] = useState('');

	return (
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
	);
}
