declare module 'require-package-name' {
  /**
   * Extract package name from a require/import string
   * @param str - The require/import string (e.g., 'lodash/isString', '@babel/core/package.json')
   * @returns The package name or null if not found
   */
  function requirePackageName(str: string): string | null;
  namespace requirePackageName {
    /**
     * Extract base package name (without scope) from a require/import string
     * @param str - The require/import string
     * @returns The base package name or null if not found
     */
    function base(str: string): string | null;
  }

  export = requirePackageName;
}
