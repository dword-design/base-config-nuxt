import build from './build.js';
import lint from './lint.js';

export default async (options = {}) => {
  options = { log: process.env.NODE_ENV !== 'test', ...options };
  await lint(options);
  return build(options);
};
