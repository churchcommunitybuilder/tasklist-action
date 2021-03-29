import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config()

import { performAction } from '../src/performAction'

process.env.GITHUB_WORKSPACE = path.join(__dirname, '..')
const githubToken = process.env.GITHUB_TOKEN ?? ''
const issueNumber = Number.parseInt(process.env.ISSUE_NUMBER ?? '', 10)

performAction(githubToken, issueNumber)
