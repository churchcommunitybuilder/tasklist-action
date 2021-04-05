import * as Github from '@actions/github'
import * as Core from '@actions/core'

import { performAction } from './performAction'

const githubToken = Core.getInput('github-token', { required: true })

performAction(githubToken, Github.context.issue.number)
