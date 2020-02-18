import nodeConfig from '@dword-design/base-config-node'
import execa from 'execa'

export default async () => {
  await nodeConfig.commands.prepublishOnly()
  await execa('nuxt', ['build', '--config-file', require.resolve('./nuxt.config')], { stdio: 'inherit' })
}
