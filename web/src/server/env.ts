import {envsafe, str} from 'envsafe';

export const env = envsafe({
	QUEUE_SECRET: str(),
});
