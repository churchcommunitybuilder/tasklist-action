import marked from 'marked'
import { handleError } from './errorHandler'
import { Octokit } from './octokit'

export async function updateComment(
  commentId: number,
  body: string,
): Promise<void> {
  await handleError(
    () =>
      Octokit.instance.issues.updateComment({
        ...Octokit.repo,
        body,
        comment_id: commentId,
      }),
    'Updated comment',
    'Failed to update comment',
  )
}

export async function createComment(
  issueNumber: number,
  body: string,
): Promise<void> {
  await handleError(
    () =>
      Octokit.instance.issues.createComment({
        ...Octokit.repo,
        issue_number: issueNumber,
        body,
      }),
    'Created new comment',
    'Failed to create new comment',
  )
}

export async function getExistingComment(
  issueNumber: number,
  commentIdentifier: string,
): Promise<[id: number, commentTokens: marked.TokensList] | null> {
  const { data: comments } = await handleError(
    () =>
      Octokit.instance.issues.listComments({
        ...Octokit.repo,
        issue_number: issueNumber,
      }),
    'Fetched all PR comments',
    'Failed to fetched PR comments',
  )

  const previousComment = comments.find((comment) =>
    comment.body?.includes(commentIdentifier),
  )

  if (previousComment?.body) {
    return [
      previousComment.id,
      marked.lexer(previousComment.body, {
        gfm: true,
        breaks: true,
        headerIds: true,
      }),
    ]
  }

  return null
}
