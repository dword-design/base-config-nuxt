import nodeConfig from '@dword-design/base-config-node'
import execa from 'execa'

export default async () => {
  await nodeConfig.commands.prepublishOnly()
  return execa('nuxt', ['build', '--config-file', require.resolve('./nuxt.config')], { stdio: 'inherit' })
}
