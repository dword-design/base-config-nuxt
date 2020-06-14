import execa from 'execa'

export default async () => {
  try {
    await execa.command(
      'eslint --fix --ext .js,.json,.vue --ignore-path .gitignore .',
      { all: true }
    )
    await execa.command(
      'stylelint --fix --allow-empty-input **/*.{css,scss,vue}',
      { all: true }
    )
  } catch (error) {
    throw new Error(error.all)
  }
}
