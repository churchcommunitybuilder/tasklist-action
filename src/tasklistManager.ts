import * as Core from '@actions/core'
import * as micromatch from 'micromatch'

import { Config } from './configuration'
import { handleError } from './errorHandler'
import { Octokit } from './octokit'

export async function getTasklistMarkdown(
  issueNumber: number,
  config: Config[],
): Promise<string | null> {
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

  const templates = config.filter((entry) =>
    micromatch.some(fileNames, entry.pattern),
  )

  if (!templates.length) {
    Core.info('No matching files found, not adding tasklist')
    return null
  }

  const matchedPatterns = templates
    .map(({ pattern }) => `  - ${pattern}`)
    .join('\n')
  Core.info(`Generated tasklists for following patterns:\n${matchedPatterns}`)

  return templates
    .map(({ template, checks }) => {
      const tasklist = checks.map((check) => `- [ ] ${check}`).join('\n')

      return `${template}\n${tasklist}`
    })
    .join('\n---\n')
}
