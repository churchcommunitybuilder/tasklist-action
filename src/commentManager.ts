import { handleError } from './errorHandler'
import { Octokit } from './octokit'

const createdByFooter = '###### Created by Tasklist Action'

export async function createComment(
  issueNumber: number,
  body: string,
): Promise<void> {
  await handleError(
    () =>
      Octokit.instance.issues.createComment({
        ...Octokit.repo,
        issue_number: issueNumber,
        body: `${body}\n---\n${createdByFooter}
  `.trim(),
      }),
    'Created new comment',
    'Failed to create new comment',
  )
}

export async function removeExistingComment(
  issueNumber: number,
): Promise<void> {
  const { data: comments } = await handleError(
    () =>
      Octokit.instance.issues.listComments({
        ...Octokit.repo,
        issue_number: issueNumber,
      }),
    'Fetched all PR comments',
    'Failed to fetched PR comments',
  )

  const existingComment = comments.find(
    (comment) => comment.user?.id === comment.body?.includes(createdByFooter),
  )

  if (existingComment) {
    await handleError(
      () =>
        Octokit.instance.issues.deleteComment({
          ...Octokit.repo,
          comment_id: existingComment.id,
        }),
      'Existing comment found, deleting...',
      'Failed to delete existing comment',
    )
  }
}
