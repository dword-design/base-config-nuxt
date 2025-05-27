import config from '@dword-design/eslint-config';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([globalIgnores(['eslint.config.js']),config,{ rules: { 'import/no-unresolved': ['error', { ignore: ['#imports'] }] } }]);
