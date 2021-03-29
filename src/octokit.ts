import * as Core from '@actions/core'
import * as Github from '@actions/github'

type OctokitInstance = ReturnType<typeof Github.getOctokit>

export class Octokit {
  private static _instance: OctokitInstance
  public static repo = Github.context.repo

  static get instance(): OctokitInstance {
    if (!Octokit._instance) {
      Core.setFailed('Octokit instance must be set before accessing.')
      process.exit(Core.ExitCode.Failure)
    }

    return Octokit._instance
  }

  static set instance(instance: OctokitInstance) {
    Octokit._instance = instance
  }
}
