import * as Core from '@actions/core'

export async function handleError<Fn extends (...args: any[]) => any>(
  fn: Fn,
  successMessage: string,
  errorMessage: string,
): Promise<ReturnType<Fn>> {
  try {
    const result = await fn()
    Core.info(successMessage)

    return result
  } catch (e) {
    Core.setFailed(`${errorMessage}: ${e.message}`)
    process.exit(Core.ExitCode.Failure)
  }
}
