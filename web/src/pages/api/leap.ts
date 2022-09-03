import {api} from '../../server/nextkit';

export default api({
	GET: ({ctx}) => ctx.getToken(),
});
