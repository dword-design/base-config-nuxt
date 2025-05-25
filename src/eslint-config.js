import { endent } from '@dword-design/functions';

export default endent`
  import config from '@dword-design/eslint-config';

  import withNuxt from './.nuxt/eslint.config.mjs';

  export default withNuxt([
    config,
    {
      files: ['eslint.config.js'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ]);
`;
