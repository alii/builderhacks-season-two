import {APIAuthentication, getIdPrefix, Id, validateId} from '@onehop/js';
import {envsafe, str, url, makeValidator, InvalidEnvError} from 'envsafe';

const hopAPIAuthentication = makeValidator<APIAuthentication>(value => {
	if (!validateId(value, 'ptk')) {
		throw new InvalidEnvError('Invalid Hop API token provided.');
	}

	return value;
});

const hopProjectID = makeValidator<Id<'project'>>(value => {
	if (!validateId(value, 'project')) {
		throw new InvalidEnvError('Invalid Hop project ID provided.');
	}

	return value;
});

export const env = envsafe({
	QUEUE_SECRET: str(),

	UPSTASH_REDIS_REST_URL: url(),
	UPSTASH_REDIS_REST_TOKEN: str(),

	HOP_API_TOKEN: hopAPIAuthentication(),
	HOP_PROJECT_ID: hopProjectID({
		default: 'project_NTAzMjYzNTY5MDg2MjYzMzI',
	}),
});
