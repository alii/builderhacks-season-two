import {useEffect, useState} from 'react';

export default function IndexPage() {
	const [percentage, setPercentage] = useState(-1);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		void navigator
			.getBattery()
			.then(battery => battery.level * 100)
			.then(setPercentage);
	}, []);

	return (
		<form className={'p-3'} action="/api/queues/find-partner" method="POST">
			<button type="submit">join queue</button>
			<input type="hidden" name="percentage" value={percentage} />
		</form>
	);
}
