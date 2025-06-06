import { expect, test } from '@playwright/test';
import depcheck from 'depcheck';
import endent from 'endent';
import outputFiles from 'output-files';

import self from './get-depcheck-special';

const tests = {
  'array syntax': {
    files: {
      'config.ts': endent`
        export default {
          modules: [
            ['foo', { bar: 'baz' }],
          ],
        }
      `,
    },
  },
  buildModules: {
    files: {
      'config.ts': endent`
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
      'config.ts': endent`
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
      'config.ts': endent`
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
      'config.ts': endent`
        export default {
          modules: [
            './modules/foo.ts',
          ],
        }
      `,
    },
  },
  scoped: {
    dependency: '@name/foo',
    files: {
      'config.ts': endent`
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
      'config.ts': endent`
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
      'config.ts': endent`
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

  test(name, async ({}, testInfo) => {
    const cwd = testInfo.outputPath();
    await outputFiles(cwd, testConfig.files);

    const result = await depcheck(cwd, {
      package: { dependencies: { [testConfig.dependency]: '^1.0.0' } },
      specials: [self({ cwd })],
    });

    expect(result.dependencies.length > 0).toEqual(testConfig.fail);
  });
}
