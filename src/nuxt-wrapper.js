#!/usr/bin/env node

import dotenv from '@dword-design/dotenv-json-extended'
import { execa } from 'execa'

dotenv.config()
execa('nuxt', process.argv.slice(2), { stdio: 'inherit' })
