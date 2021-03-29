import * as Github from '@actions/github'
import * as path from 'path'

import { Octokit } from './octokit'
import { createComment, removeExistingComment } from './commentManager'
import { getTasklistMarkdown } from './tasklistManager'
import { loadConfiguration } from './configuration'

Octokit.instance = Github.getOctokit('43a202d108a036325bc71e06593967b12c55ec2b')

const issueNumber = Github.context.issue.number ?? 8276
process.env.GITHUB_WORKSPACE = path.join(__dirname, '..')

async function performAction() {
  const configs = await loadConfiguration()
  const tasklist = await getTasklistMarkdown(issueNumber, configs)

  await removeExistingComment(issueNumber)

  if (tasklist) {
    await createComment(issueNumber, tasklist)
  }
}

performAction()
