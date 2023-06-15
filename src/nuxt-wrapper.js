#!/usr/bin/env node

import dotenv from '@dword-design/dotenv-json-extended'
import { execa } from 'execa'

const args = process.argv.slice(2)
dotenv.config()
execa('nuxt', args, {
  ...(args[0] === 'dev' ? { env: { NODE_ENV: 'development' } } : {}),
  stdio: 'inherit',
})
