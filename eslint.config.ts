import config from '@dword-design/eslint-config';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([globalIgnores(['eslint.config.ts']),config,{ rules: { 'import-x/no-unresolved': ['error', { ignore: ['#imports'] }] } }]);
