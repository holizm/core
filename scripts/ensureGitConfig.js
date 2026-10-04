import configureGitMerge from './configureGitMerge.js'
import {
    errorAndExit,
    info,
} from './logger.js'
import { runOnTerminal } from './terminal.js'

const gitGet = key =>
    runOnTerminal(`git config --global ${key}`, { show: false })

export default () => {
    configureGitMerge()
    const gitName = gitGet('user.name')
    const gitEmail = gitGet('user.email')
    const gpgFormat = gitGet('gpg.format')
    const signingKey = gitGet('user.signingkey')
    const commitSign = gitGet('commit.gpgsign')

    if (!gitName) errorAndExit('Git user.name is not set')
    if (!gitEmail) errorAndExit('Git user.email is not set')
    if (gpgFormat !== 'ssh') errorAndExit(`Git gpg.format is not 'ssh'`)
    if (!signingKey) errorAndExit('Git user.signingkey is not set')
    if (commitSign !== 'true') errorAndExit('Git commit.gpgsign is not enabled')

    info()
    info(`Git configuration OK: ${gitName} <${gitEmail}>, signing enabled with ${signingKey}`)
}
