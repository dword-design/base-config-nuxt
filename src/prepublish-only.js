export default async function (options) {
  //await this.lint(options);
  return this.run('build', options);
}
