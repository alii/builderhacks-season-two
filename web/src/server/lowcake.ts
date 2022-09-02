import {Lowcake} from 'lowcake';
import {env} from './env';

export const lowcake = new Lowcake(env.LOWCAKE_API_KEY);
