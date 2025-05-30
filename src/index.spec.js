import { Base } from '@dword-design/base';
import { endent } from '@dword-design/functions';
import { test } from '@playwright/test';
import packageName from 'depcheck-package-name';
import outputFiles from 'output-files';

import config from './index.js';

test('dotenv: module', async ({}, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    '.test.env.json': JSON.stringify({ foo: 'bar' }),
    'modules/foo.js': endent`
      import { expect } from '${packageName`expect`}'

      export default () => expect(process.env.FOO).toEqual('bar')
    `,
    'package.json': JSON.stringify({ dependencies: { expect: '*' } }),
    'pages/index.vue': endent`
      <template>
        <div>Hello world</div>
      </template>
    `,
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  await base.run('prepublishOnly');
});

test('minimal', async ({}, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
    /*'modules/foo.js': endent`
      import { expect } from '${packageName`expect`}'

      export default () => console.log('foo');
    `,*/
    'pages/index.vue': endent`
      <template>
        <div>Hello world</div>
      </template>
    `,
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  await base.run('prepublishOnly');
});
