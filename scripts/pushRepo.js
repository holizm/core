import { execFile } from 'child_process'
import { promisify } from 'util'
import {
    info,
    success,
    warning,
} from './logger.js'

const execFileAsync = promisify(execFile)
const runGit = async (repo, args) => {
    const result = await execFileAsync('git', ['-C', repo, ...args], {
        maxBuffer: 1024 * 1024 * 20,
    })
    if (result.stdout) process.stdout.write(result.stdout)
    if (result.stderr) process.stderr.write(result.stderr)
    return result.stdout.trim()
}

export default async repo => {
    info(`Pushing ${repo}`)
    try {
        if (await runGit(repo, ['ls-files', '--unmerged'])) {
            warning(`Unresolved conflicts in ${repo}; human review required`)
            return false
        }
        const maxAttempts = 10
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await runGit(repo, ['push'])
                success(`Pushed ${repo}`)
                return true
            } catch (e) {
                const message = e.stderr || e.message
                if (attempt === maxAttempts || !/non-fast-forward|fetch first|remote contains work/i.test(message)) throw e
                info(`Integrating remote changes in ${repo} using ort`)
                await runGit(repo, ['pull', '--no-rebase', '--no-edit', '--ff', '--strategy=ort'])
            }
        }
    } catch (e) {
        warning(`Push failed for ${repo}: ${e.stderr || e.message}`)
        return false
    }
}
