import projectConfig from '../../project.config'
import P from 'path'

export default {
  cssDest: P.join('dist', 'acss.css'),
  configs: {
    classNames: [],
    breakPoints: projectConfig.breakpoints,
    custom: projectConfig.cssVariables,
  },
}