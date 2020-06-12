import execa from 'execa'

export default async (options = {}) => {
  try {
    await execa.command(
      `eslint --fix --ext .js,.json${
        options.excludeVueFiles ? '' : ',.vue'
      } --ignore-path .gitignore .`,
      { all: true }
    )
  } catch (error) {
    throw new Error(error.all)
  }
}
