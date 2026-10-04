import { execFileSync } from 'child_process'
import { info } from './logger.js'

export default repo => {
    const args = ['-C', repo]
    const options = { encoding: 'utf8' }
    const porcelain = execFileSync('git', [...args, 'status', '--porcelain'], options)
    if (!porcelain.trim()) return false
    const unmerged = execFileSync('git', [...args, 'ls-files', '--unmerged'], options)
    if (unmerged.trim()) throw new Error(`Unresolved conflicts in ${repo}; human review required`)

    info(`Committing ${repo}`)
    execFileSync('git', [...args, 'add', '.'], { stdio: 'inherit' })
    execFileSync('git', [...args, 'commit', '-S', '-m', 'committed by script'], { stdio: 'inherit' })
    return true
}
