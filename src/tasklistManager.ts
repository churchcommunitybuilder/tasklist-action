import marked from 'marked'
import {
  createComment,
  getExistingComment,
  updateComment,
} from './commentManager'
import { TasklistConfigs, TasklistConfig } from './configurationManager'

const tasklistCommentUniqueId = 'tasklist-action-unique-id'
const createdByFooter = '###### Created by Tasklist Action'

const createBeginDelimiter = (id: string) => `<!-- ${id} begin -->`
const createEndDelimiter = (id: string) => `<!-- ${id} end -->`
const beginExpression = new RegExp(/<!-- (.*) begin -->/)
const endExpression = new RegExp(/<!-- (.*) end -->/)

function getIdFromDelimiter(text: string, expression: RegExp) {
  const match = expression.exec(text)

  return match?.[1] ?? null
}

function isHTML(token: marked.Token): token is marked.Tokens.HTML {
  return (token as marked.Tokens.HTML).type === 'html'
}

function isList(token: marked.Token): token is marked.Tokens.List {
  return (token as marked.Tokens.List).type === 'list'
}

function mergeConfigWithExistingComment(
  configs: TasklistConfigs,
  commentTokens: marked.TokensList,
) {
  let nextListId: string | null = null

  const existingLists = commentTokens.reduce<
    Record<string, TasklistConfig['checks']>
  >((acc, token) => {
    if (isHTML(token)) {
      const id = getIdFromDelimiter(token.text, beginExpression)
      if (id) {
        nextListId = id
      } else if (getIdFromDelimiter(token.text, endExpression)) {
        nextListId = null
      }
    } else if (isList(token) && nextListId) {
      return {
        ...acc,
        [nextListId]: token.items.map((item) => ({
          label: item.text,
          checked: item.checked,
        })),
      }
    }

    return acc
  }, {})

  return configs.map((config) => ({
    ...config,
    checks: existingLists[config.id] ?? config.checks,
  }))
}

function generateMarkdown(configs: TasklistConfigs) {
  const lists = configs
    .map(({ template, id, checks }) => {
      const tasklist = checks
        .map((check) => {
          const checkMarkup = check.checked ? '[x]' : '[ ]'

          return `- ${checkMarkup} ${check.label}`
        })
        .join('\n')

      return `
${createBeginDelimiter(id)}

${template}
${tasklist}

${createEndDelimiter(id)}
      `.trim()
    })
    .join('\n---\n')

  return `
${lists}
---
${createdByFooter}
<!-- ${tasklistCommentUniqueId} -->
  `.trim()
}

export async function createTasklist(
  issueNumber: number,
  configs: TasklistConfigs,
): Promise<void> {
  const existingComment = await getExistingComment(
    issueNumber,
    tasklistCommentUniqueId,
  )

  if (existingComment) {
    const [commentId, commentTokens] = existingComment
    const updatedConfigs = mergeConfigWithExistingComment(
      configs,
      commentTokens,
    )
    const markdown = generateMarkdown(updatedConfigs)
    await updateComment(commentId, markdown)
  } else {
    const markdown = generateMarkdown(configs)
    await createComment(issueNumber, markdown)
  }
}
