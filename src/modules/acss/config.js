import projectConfig from '../../project.config'
import P from 'path'

export default {
  cssDest: P.join('dist', 'nuxt', 'acss.css'),
  configs: {
    classNames: [],
    breakPoints: projectConfig.breakpoints,
    custom: projectConfig.cssVariables,
  },
}