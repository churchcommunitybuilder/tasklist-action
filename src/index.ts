import * as Github from '@actions/github'
import * as Core from '@actions/core'

import { Octokit } from './octokit'
import { createComment, removeExistingComment } from './commentManager'
import { getTasklistMarkdown } from './tasklistManager'

async function performAction() {
  const issueNumber = Github.context.issue.number

  if (!issueNumber) {
    Core.setFailed('This action must be run on the pull_request event')
    process.exit(Core.ExitCode.Failure)
  }

  const githubToken = Core.getInput('github-token', { required: true })
  const tasklistsInput = Core.getInput('tasklists', { required: true })
  Octokit.instance = Github.getOctokit(githubToken)

  const tasklist = await getTasklistMarkdown(issueNumber, tasklistsInput)

  // Always remove the previous comment, even if there isn't going to be a new one
  await removeExistingComment(issueNumber)

  if (tasklist) {
    await createComment(issueNumber, tasklist)
  }
}

performAction()
