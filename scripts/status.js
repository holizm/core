import { runOnTerminal } from "./terminal.js"
import findRepos from './findRepos.js'
import {
    divide,
    info,
    warning,
} from './logger.js'

function printStatus(repoPath) {
    try {
        const status = runOnTerminal(`git -C ${repoPath} status`)
        if (/Changes|Untracked/.test(status)) {
            info(repoPath)
            const porcelain = runOnTerminal(`git -C ${repoPath} status --porcelain`)
            console.log(porcelain.trim())
            divide()
        } else if (/ahead/.test(status)) {
            warning(`Push ${repoPath}`)
            divide()
        } else if (/diverged/.test(status)) {
            warning(`Sync ${repoPath}`)
            divide()
        }
    } catch (err) {
        console.error(`\x1b[31mError checking ${repoPath}: ${err.message}\x1b[0m`)
    }
}

export default search => {
    const gitDirs = findRepos(search)
    for (const repo of gitDirs) printStatus(repo)
}
