import { endent } from '@dword-design/functions';
import { expect } from '@playwright/test';
import depcheck from 'depcheck';
import outputFiles from 'output-files';
import { test } from 'playwright-local-tmp-dir';

import self from './depcheck-special.js';

const tests = {
  'array syntax': {
    files: {
      'config.js': endent`
        export default {
          modules: [
            ['foo', { bar: 'baz' }],
          ],
        }
      `,
    },
  },
  'babel feature': {
    files: {
      'config.js': endent`
        export default {
          modules: ['foo'],
          foo: 1 |> x => x * 2,
        }
      `,
    },
  },
  buildModules: {
    files: {
      'config.js': endent`
        export default {
          buildModules: [
            'foo',
          ],
        }
      `,
    },
  },
  function: {
    files: {
      'config.js': endent`
        export default {
          modules: [
            'foo',
            () => {},
          ],
        }
      `,
    },
  },
  modules: {
    files: {
      'config.js': endent`
        export default {
          modules: [
            'foo',
          ],
        }
      `,
    },
  },
  'relative path': {
    fail: true,
    files: {
      'config.js': endent`
        export default {
          modules: [
            './modules/foo.js',
          ],
        }
      `,
    },
  },
  scoped: {
    dependency: '@name/foo',
    files: {
      'config.js': endent`
        export default {
          modules: [
            '@name/foo',
          ],
        }
      `,
    },
  },
  'scoped and subpath': {
    dependency: '@name/foo',
    files: {
      'config.js': endent`
        export default {
          modules: [
            '@name/foo/bar',
          ],
        }
      `,
    },
  },
  subpath: {
    files: {
      'config.js': endent`
        export default {
          modules: [
            'foo/bar',
          ],
        }
      `,
    },
  },
  'unused dependency': { fail: true },
};

for (const [name, _testConfig] of Object.entries(tests)) {
  const testConfig = { dependency: 'foo', fail: false, ..._testConfig };

  test(name, async () => {
    await outputFiles(testConfig.files);

    const result = await depcheck('.', {
      package: { dependencies: { [testConfig.dependency]: '^1.0.0' } },
      specials: [self],
    });

    expect(result.dependencies.length > 0).toEqual(testConfig.fail);
  });
}
