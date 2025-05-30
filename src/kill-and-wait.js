import { expect } from '@playwright/test';
import isPortFree from 'is-port-free';
import pWaitFor from 'p-wait-for';
import kill from 'tree-kill-promise';

export default async (nuxt, port) => {
  await kill(nuxt.pid);
  await expect(() => isPortFree(port)).toPass();
};
