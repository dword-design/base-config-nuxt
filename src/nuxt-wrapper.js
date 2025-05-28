#!/usr/bin/env node

import dotenv from '@dword-design/dotenv-json-extended';
import { x } from 'tinyexec';

dotenv.config();

x('nuxt', process.argv.slice(2), {
  nodeOptions: { stdio: 'inherit' },
  throwOnError: true,
});
