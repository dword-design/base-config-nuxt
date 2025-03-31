import jitiBabelTransform from '@dword-design/jiti-babel-transform';
import { createJiti } from 'jiti';

let config;

try {
  const jitiInstance = createJiti(process.cwd(), {
    interopDefault: true,
    transform: jitiBabelTransform,
  });

  config = jitiInstance('./config.js');
} catch (error) {
  if (error.message.startsWith("Cannot find module './config.js'\n")) {
    config = {};
  } else {
    throw error;
  }
}

export default { name: 'Vue app', userScalable: true, ...config };
