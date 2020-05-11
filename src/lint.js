import execa from 'execa'
import { outputFile } from 'fs-extra'
import eslintConfig from './eslint.config'

export default async () => {
  await outputFile('.eslintrc.json', JSON.stringify(eslintConfig, undefined, 2))
  try {
    await execa.command(
      'eslint --fix --ext .js,.json --ignore-path .gitignore .',
      { all: true }
    )
  } catch ({ all }) {
    throw new Error(all)
  }
}
