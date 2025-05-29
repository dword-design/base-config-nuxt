import pWaitFor from 'p-wait-for';
import kill from 'tree-kill-promise';

import isPortFree from './is-port-free.js';

export default async (nuxt, port) => {
  await kill(nuxt.pid, 'SIGINT');
  await pWaitFor(() => isPortFree(port));
};
