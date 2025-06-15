import { createJiti } from 'jiti';

const jiti = createJiti(process.cwd(), { interopDefault: true });
let config = {};

try {
  config = jiti('./config.ts');
} catch (error) {
  if (!error.message.startsWith(`Cannot find module './config.ts'`)) {
    throw error;
  }
}

export default { name: 'Vue app', userScalable: true, ...config };
