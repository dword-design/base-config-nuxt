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

export default { name: 'Vue app', userScalable: true, ...config };
