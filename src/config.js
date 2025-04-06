import { pathToFileURL } from 'url'
import pathLib from 'path';

let config;

try {
  const modulePath = pathLib.join(process.cwd(), 'config.js')
  config = (await import(pathToFileURL(modulePath).href)).default;
} catch (error) {
  if (err.code === 'ERR_MODULE_NOT_FOUND') {
    config = {};
  } else {
    throw error;
  }
}

export default { name: 'Vue app', userScalable: true, ...config };
