import { runOnTerminal } from "./terminal.js"
import findRepos from './findRepos.js'
import {
    divide,
    info,
    warning,
} from './logger.js'

const getRepoStatus = repoPath => {
    const s = runOnTerminal(`git -C ${repoPath} status`)

    if (/Changes|Untracked/.test(s)) {
        const porcelain = runOnTerminal(`git -C ${repoPath} status --porcelain`).trim()

        info(repoPath)
        console.log(porcelain)
        divide()

        return {
            type: 'dirty',
            repo: repoPath,
            porcelain
        }
    }

    if (/ahead/.test(s)) {
        warning(`Push ${repoPath}`)
        divide()

        return { type: 'ahead', repo: repoPath }
    }

    if (/diverged/.test(s)) {
        warning(`Sync ${repoPath}`)
        divide()

        return { type: 'diverged', repo: repoPath }
    }

    return { type: 'clean', repo: repoPath }
}

export default search => {
    const gitDirs = findRepos(search)
    return gitDirs.map(getRepoStatus)
}
