import pathLib from 'node:path';
import { pathToFileURL } from 'node:url';

const moduleUrl = pathToFileURL(pathLib.join(process.cwd(), 'config.ts')).href;

const { default: config } = await import(moduleUrl).catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND' && error.url === moduleUrl) {
    return { default: {} };
  } else {
    throw error;
  }
});

export default { name: 'Vue app', userScalable: true, ...config };
