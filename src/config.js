import pathLib from 'path';
import { pathToFileURL } from 'url';

let config;
const moduleUrl = pathToFileURL(pathLib.join(process.cwd(), 'config.js')).href;

try {
  config = (await import(moduleUrl)).default;
} catch (error) {
  if (error.code === 'ERR_MODULE_NOT_FOUND' && error.url === moduleUrl) {
    config = {};
  } else {
    throw error;
  }
}

export default { name: 'Vue app', userScalable: true, ...config };
