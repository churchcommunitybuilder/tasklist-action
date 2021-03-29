import * as path from 'path'
import * as fs from 'fs'
import * as yaml from 'js-yaml'

import { handleError } from './errorHandler'

export type Config = {
  pattern: string
  template: string
  checks: string[]
}

export async function loadConfiguration(): Promise<Config[]> {
  const configPath = path.join(
    process.env.GITHUB_WORKSPACE ?? '',
    '.github',
    'tasklist.yml',
  )

  const config = await handleError(
    () => fs.readFileSync(configPath).toString(),
    `Read config from ${configPath}`,
    `Failed to read config from ${configPath}`,
  )

  return handleError(
    () => yaml.load(config) as Config[],
    'Parsed config',
    'Failed to parse config',
  )
}
