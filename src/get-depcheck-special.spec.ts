import { expect, test } from '@playwright/test';
import depcheck from 'depcheck';
import endent from 'endent';
import type { Files } from 'output-files';
import outputFiles from 'output-files';
import defu from '@dword-design/defu';

import self from './get-depcheck-special';

type TestConfig = { files?: Files; dependency?: string; fail?: boolean };

const tests: Record<string, TestConfig> = {
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
  const testConfig = defu(_testConfig, { dependency: 'foo', fail: false, files: {} });

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
