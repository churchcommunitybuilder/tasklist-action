import * as Github from '@actions/github'
import * as yaml from 'js-yaml'

import { handleError } from './errorHandler'
import { Octokit } from './octokit'

export type TasklistConfig = {
  pattern: string
  template: string
  checks: string[]
}

const configFilePath = '.github/tasklists.yml'

export async function loadConfiguration(): Promise<TasklistConfig[]> {
  const fileResponse = await handleError(
    () =>
      Octokit.instance.repos.getContent({
        ...Octokit.repo,
        path: configFilePath,
        ref: Github.context.ref,
      }),
    'Loaded configuration file',
    `Failed to load configuration file at ${configFilePath}`,
  )

  const rawConfig = fileResponse.data as { content: string; encoding: string }
  const configContents = await handleError(
    () => Buffer.from(rawConfig.content, rawConfig.encoding as any).toString(),
    'Read config file',
    'Failed to read config file',
  )

  return handleError(
    () => yaml.load(configContents) as TasklistConfig[],
    'Parsed tasklists config',
    'Invalid tasklists config',
  )
}
