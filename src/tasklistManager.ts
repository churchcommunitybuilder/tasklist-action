import * as Core from '@actions/core'
import * as micromatch from 'micromatch'
import * as yaml from 'js-yaml'

import { handleError } from './errorHandler'
import { Octokit } from './octokit'

type TasklistConfig = {
  pattern: string
  template: string
  checks: string[]
}

export async function getTasklistMarkdown(
  issueNumber: number,
  rawTasklists: string,
): Promise<string | null> {
  const tasklists = await handleError(
    () => yaml.load(rawTasklists) as TasklistConfig[],
    'Parsed tasklists config',
    'Invalid tasklists config',
  )

  const { data: files } = await handleError(
    () =>
      Octokit.instance.pulls.listFiles({
        ...Octokit.repo,
        pull_number: issueNumber,
      }),
    'Fetched files for PR',
    'Failed to fetch files for PR',
  )

  const fileNames = files.map((file) => file.filename)

  const matchingTasklists = tasklists.filter((tasklist) =>
    micromatch.some(fileNames, tasklist.pattern),
  )

  if (!matchingTasklists.length) {
    Core.info('No matching files found, not adding tasklist')
    return null
  }

  const matchedPatterns = matchingTasklists
    .map(({ pattern }) => `  - ${pattern}`)
    .join('\n')
  Core.info(`Generated tasklists for following patterns:\n${matchedPatterns}`)

  return matchingTasklists
    .map(({ template, checks }) => {
      const tasklist = checks.map((check) => `- [ ] ${check}`).join('\n')

      return `${template}\n${tasklist}`
    })
    .join('\n---\n')
}
