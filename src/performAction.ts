import * as Github from '@actions/github'
import * as Core from '@actions/core'

import { Octokit } from './octokit'
import { createTasklist } from './tasklistManager'
import { loadConfiguration } from './configurationManager'

export async function performAction(
  githubToken: string,
  issueNumber: number,
): Promise<void> {
  if (!issueNumber) {
    Core.setFailed('This action must be run on the pull_request event')
    process.exit(Core.ExitCode.Failure)
  }

  Octokit.instance = Github.getOctokit(githubToken)

  const configuration = await loadConfiguration(issueNumber)

  if (configuration) {
    await createTasklist(issueNumber, configuration)
  }
}
