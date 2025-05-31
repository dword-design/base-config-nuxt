import { expect } from '@playwright/test';
import isPortFree from 'is-port-free';
import kill from 'tree-kill-promise';

export default async (nuxt, port) => {
  await kill(nuxt.pid);
  await expect(() => isPortFree(port)).toPass();
};
