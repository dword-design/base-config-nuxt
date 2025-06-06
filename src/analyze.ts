import { execaCommand } from 'execa';

export default () => execaCommand('nuxt build --analyze');
