import { expect } from '@playwright/test';
import isPortFree from 'is-port-free';
import pWaitFor from 'p-wait-for';
import kill from 'tree-kill-promise';

//import isPortFree from './is-port-free.js';

console.log(pWaitFor.foo);
console.log(expect.foo);
console.log(isPortFree.foo);

export default async (nuxt, port) => {
  await kill(nuxt.pid /*, 'SIGINT'*/);
  console.log('waiting for port release');
  await expect(() => isPortFree(port)).toPass();
  //await pWaitFor(() => isPortFree(port));
  console.log('port released');
};
