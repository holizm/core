import { execFileSync } from 'child_process'
import path from 'path'
import { info } from './logger.js'

export default repo => {
    const args = ['-C', repo]
    const options = { encoding: 'utf8' }
    const porcelain = execFileSync('git', [...args, 'status', '--porcelain'], options)
    const trackedFiles = execFileSync('git', [...args, 'ls-files', '-z'], options)
        .split('\0')
        .filter(file => path.basename(file) === 'AGENTS.md')
    if (!porcelain.trim() && !trackedFiles.length) return false
    const unmerged = execFileSync('git', [...args, 'ls-files', '--unmerged'], options)
    if (unmerged.trim()) throw new Error(`Unresolved conflicts in ${repo}; human review required`)

    info(`Committing ${repo}`)
    execFileSync('git', [...args, 'add', '.'], { stdio: 'inherit' })
    const stagedAgentFiles = execFileSync('git', [...args, 'ls-files', '-z'], options)
        .split('\0')
        .filter(file => path.basename(file) === 'AGENTS.md')
    if (stagedAgentFiles.length) {
        execFileSync('git', [...args, 'rm', '--cached', '-f', '--', ...stagedAgentFiles], { stdio: 'inherit' })
    }
    const staged = execFileSync('git', [...args, 'diff', '--cached', '--name-only'], options)
    if (!staged.trim()) return false
    execFileSync('git', [...args, 'commit', '-S', '-m', 'committed by script'], { stdio: 'inherit' })
    return true
}
