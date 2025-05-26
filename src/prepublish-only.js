import build from './build.js';
import lint from './lint.js';

export default async options => {
  await lint(options);
  return build(options);
};
