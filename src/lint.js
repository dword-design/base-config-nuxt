import execa from 'execa'

export default async () => {
  try {
    await execa.command(
      'eslint --fix --ignore-path .gitignore --ext .js,.json,.vue .',
      { all: true }
    )
    await execa.command(
      'stylelint --fix --allow-empty-input --ignore-path .gitignore **/*.{css,scss,vue}',
      { all: true }
    )
  } catch (error) {
    throw new Error(error.all)
  }
}
