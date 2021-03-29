import * as Github from '@actions/github'
import * as Core from '@actions/core'

import { Octokit } from './octokit'
import { createComment, removeExistingComment } from './commentManager'
import { getTasklistMarkdown } from './tasklistManager'
import { loadConfiguration } from './configuration'

export async function performAction(
  githubToken: string,
  issueNumber: number,
): Promise<void> {
  if (!issueNumber) {
    Core.setFailed('This action must be run on the pull_request event')
    process.exit(Core.ExitCode.Failure)
  }
  Octokit.instance = Github.getOctokit(githubToken)

  const configuration = await loadConfiguration()
  const tasklist = await getTasklistMarkdown(issueNumber, configuration)

  // Always remove the previous comment, even if there isn't going to be a new one
  await removeExistingComment(issueNumber)

  if (tasklist) {
    await createComment(issueNumber, tasklist)
  }
}
