import { expect } from '@playwright/test';
import isPortFree from 'is-port-free';
import pWaitFor from 'p-wait-for';
import kill from 'tree-kill-promise';

//import isPortFree from './is-port-free.js';

console.log(pWaitFor.foo);
console.log(expect.foo);
console.log(isPortFree.foo);

export default async nuxt => {
  await kill(nuxt.pid, 'SIGINT');
  //await expect(() => isPortFree(port)).toPass();
  //await pWaitFor(() => isPortFree(port));
};
