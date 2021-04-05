import * as Github from '@actions/github'
import * as Core from '@actions/core'
import * as yaml from 'js-yaml'
import * as micromatch from 'micromatch'

import { handleError } from './errorHandler'
import { Octokit } from './octokit'

type RawTasklistConfig = {
  id: string
  pattern: string
  template: string
  checks: string[]
}

export type TasklistConfig = Omit<RawTasklistConfig, 'checks'> & {
  checks: {
    label: string
    checked: boolean
  }[]
}

type RawTasklistConfigs = RawTasklistConfig[]
export type TasklistConfigs = TasklistConfig[]

const configFilePath = '.github/tasklists.yml'

function mapConfigs(configs: RawTasklistConfigs): TasklistConfigs {
  return configs.map((config) => ({
    ...config,
    checks: config.checks.map((check) => ({
      label: check,
      checked: false,
    })),
  }))
}

async function filterConfigs(
  issueNumber: number,
  configs: RawTasklistConfigs,
): Promise<RawTasklistConfigs | null> {
  const { data: files } = await handleError(
    () =>
      Octokit.instance.pulls.listFiles({
        ...Octokit.repo,
        pull_number: issueNumber,
        per_page: 100,
      }),
    'Fetched files for PR',
    'Failed to fetch files for PR',
  )

  const changedFiles = files.map((file) => file.filename)

  const matchingConfigurations = configs.filter((configuration) =>
    micromatch.some(changedFiles, configuration.pattern),
  )

  if (!matchingConfigurations.length) {
    Core.info('No matching files found, not adding tasklist')
    return null
  }

  const matchedPatterns = matchingConfigurations
    .map(({ pattern }) => `  - ${pattern}`)
    .join('\n')

  Core.info(`Matched the following configurations:\n${matchedPatterns}`)

  return matchingConfigurations
}

export async function loadConfiguration(
  issueNumber: number,
): Promise<TasklistConfigs | null> {
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

  const rawConfig = fileResponse.data as {
    content: string
    encoding: string
  }
  const configContents = await handleError(
    () => Buffer.from(rawConfig.content, rawConfig.encoding as any).toString(),
    'Read config file',
    'Failed to read config file',
  )

  const parsedConfigs = await handleError(
    () => yaml.load(configContents) as RawTasklistConfigs,
    'Parsed tasklists config',
    'Invalid tasklists config',
  )

  const filteredConfigs = await filterConfigs(issueNumber, parsedConfigs)

  return filteredConfigs ? mapConfigs(filteredConfigs) : null
}
