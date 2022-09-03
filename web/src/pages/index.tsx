import {useEffect, useState} from 'react';

export default function IndexPage() {
	const [percentage, setPercentage] = useState(-1);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		void navigator
			.getBattery()
			.then(battery => {
				return battery.level * 100;
			})
			.then(percentage => {
				setPercentage(percentage);
			});
	}, []);

	return (
		<form action="/api/queues/find-partner" method="POST">
			<button type="submit">join queue</button>
			<input type="hidden" name="percentage" value={percentage} />
		</form>
	);
}
