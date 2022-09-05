import {Lowcake} from 'lowcake';
import {env} from './env';

// So turns out TypeScript still is not fully ESM ready because we can't use .ts to import other files - meaning
// that Next.js can't resolve a .js file when really it's looking for a .ts file in module mode
// @ts-expect-error
import {createNextAdapter as _createNextAdapter} from 'lowcake/adapters/next';

const createNextAdapter =
	_createNextAdapter as typeof import('lowcake/dist/adapters/next').createNextAdapter;

export const lowcake = new Lowcake(env.LOWCAKE_API_KEY);

export const {queue} = createNextAdapter(lowcake);
