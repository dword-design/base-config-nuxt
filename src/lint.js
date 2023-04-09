import { execaCommand } from 'execa'

export default async () => {
  try {
    await execaCommand(
      'eslint --fix --ignore-path .gitignore --ext .js,.json,.vue .',
      { all: true },
    )
    await execaCommand(
      'stylelint --fix --allow-empty-input --ignore-path .gitignore **/*.{css,scss,vue}',
      { all: true },
    )
  } catch (error) {
    throw new Error(error.all)
  }
}
