import findRepos from './findRepos.js'
import isFile from './isFile.js'
import {
    divide,
    info,
    warning,
} from './logger.js'
import { runOnTerminal } from './terminal.js'

const quote = value => `'${value.replaceAll(`'`, `'\\''`)}'`

const getRepoStatus = repoPath => {
    const git = `git -C ${quote(repoPath)}`
    const status = runOnTerminal(`${git} status --porcelain=v1 --branch`)
    const [branch, ...changes] = status.split('\n')
    const porcelain = changes.join('\n')
    const diverged = /ahead \d+, behind/.test(branch)
    const ahead = /ahead \d+/.test(branch)
    const type = porcelain ? 'dirty' : diverged ? 'diverged' : ahead ? 'ahead' : 'clean'
    if (type === 'clean') {
        const result = {
            repo: repoPath,
            type,
        }
        return result
    }

    if (porcelain) {
        info(repoPath)
        console.log(porcelain)
    }
    else warning(`${diverged ? 'Sync' : 'Push'} ${repoPath}`)
    divide()

    const changed = porcelain
        ? [
            ...runOnTerminal(`${git} diff --name-only -z`).split('\0'),
            ...runOnTerminal(`${git} diff --cached --name-only -z`).split('\0'),
            ...runOnTerminal(`${git} ls-files --others --exclude-standard -z`).split('\0'),
        ]
        : []
    const committed = ahead
        ? runOnTerminal(`${git} diff --name-only -z '@{upstream}...HEAD'`).split('\0')
        : []
    const check = quote(`${process.env.HOME}/core/commands/check`)
    for (const file of new Set([...changed, ...committed])) {
        if (!file) continue
        const filePath = `${repoPath}/${file}`
        if (isFile(filePath)) runOnTerminal(`${check} ${quote(filePath)} --noClear`, { show: true })
    }

    const result = {
        porcelain,
        repo: repoPath,
        type,
    }
    return result
}

export default search => findRepos(search).map(getRepoStatus)
