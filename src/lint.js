import execa from 'execa'

export default async ({ excludeVueFiles } = {}) => {
  try {
    await execa.command(
      `eslint --fix --ext .js,.json${
        excludeVueFiles ? '' : ',.vue'
      } --ignore-path .gitignore .`,
      { all: true }
    )
  } catch ({ all }) {
    throw new Error(all)
  }
}
