import projectConfig from '../project.config'

export default {
  cssDest: '.acss/index.css',
  configs: {
    classNames: [],
    breakPoints: projectConfig.breakpoints,
    custom: projectConfig.cssVariables,
  },
}