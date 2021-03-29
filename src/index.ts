import * as Github from '@actions/github'
import * as Core from '@actions/core'

import { Octokit } from './octokit'
import { createComment, removeExistingComment } from './commentManager'
import { getTasklistMarkdown } from './tasklistManager'
import { loadConfiguration } from './configuration'

async function performAction() {
  const issueNumber = Github.context.issue.number

  if (!issueNumber) {
    Core.setFailed('This action must be run on the pull_request event')
    process.exit(Core.ExitCode.Failure)
  }

  const githubToken = Core.getInput('github-token', { required: true })
  Octokit.instance = Github.getOctokit(githubToken)

  const configs = await loadConfiguration()
  const tasklist = await getTasklistMarkdown(issueNumber, configs)

  await removeExistingComment(issueNumber)

  if (tasklist) {
    await createComment(issueNumber, tasklist)
  }
}

performAction()
