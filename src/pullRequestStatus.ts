import * as marked from 'marked'

import { Octokit } from './octokit'

export async function setStatus(
  sha: string,
  checkedTasks: number,
  totalTasks: number,
): Promise<void> {
  await Octokit.instance.repos.createCommitStatus({
    ...Octokit.repo,
    sha,
    context: 'Tasklist',
    description: `${checkedTasks}/${totalTasks} Complete`,
    state: checkedTasks === totalTasks ? 'success' : 'pending',
  })
}

export function calculateCheckedItems(comment: string): number {
  const tokens = marked.lexer(comment)
  const uncheckedItemsCount = tokens.reduce((acc, t) => {
    const token = t as marked.Tokens.List
    if (token.type !== 'list') {
      return acc
    }
    return token.items.reduce((acc, item) => acc + (item.checked ? 0 : 1), acc)
  }, 0)

  return uncheckedItemsCount
}
