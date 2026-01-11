import { createJiti } from 'jiti';

/**
 * TODO: For some reason when using a dynamic import, the config.ts file will sometimes stay
 * or be regenerated into the Playwright test output directory.
 * 
import pathLib from 'node:path';
import { pathToFileURL } from 'node:url';

const modulePath = pathLib.join(process.cwd(), 'config.ts');
const moduleUrl = pathToFileURL(modulePath).href;

const { default: config } = await import(moduleUrl).catch(error => {
  if (error.message.startsWith(`Cannot find module '${modulePath}'`)) {
    return { default: {} };
  } else {
    throw error;
  }
});
 */

const jiti = createJiti(process.cwd());
let config = {};

try {
  config = await jiti.import('./config.ts', { default: true });
} catch (error) {
  if (!error.message.startsWith(`Cannot find module './config.ts'`)) {
    throw error;
  }
}

export default { name: 'Vue app', userScalable: true, ...config };
