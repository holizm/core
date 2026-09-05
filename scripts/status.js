import { runOnTerminal } from './terminal.js'
import findRepos from './findRepos.js'
import { isDir } from './os.js'
import {
    divide,
    info,
    warning,
} from './logger.js'

const getRepoStatus = repoPath => {
    const s = runOnTerminal(`git -C ${repoPath} status`)
    const home = process.env.HOME

    if (/Changes|Untracked/.test(s)) {
        const porcelain = runOnTerminal(`git -C ${repoPath} status --porcelain`).trim()

        info(repoPath)
        console.log(porcelain)
        divide()

        const statusOutput = runOnTerminal(`git -C ${repoPath} status --porcelain`)
        if (statusOutput) {
            const changedFiles = statusOutput.split('\n')
                .filter(line => line.trim() !== '')
                .map(line => line.split(' ')[1])
                .filter(file => file)


            for (const file of changedFiles) {
                const filePath = `${repoPath}/${file}`

                if (filePath.includes(`${home}/policies/`)) {
                    continue
                }

                const targetFiles = isDir(filePath)
                    ? runOnTerminal(
                        `find -H "${filePath}" -mindepth 1 -type f -not -name .git -not -path "*/.git/*"`,
                        { splitLines: true }
                    ).filter(Boolean)
                    : [filePath]

                for (const targetFile of targetFiles) {
                    // runOnTerminal(`node ${home}/policies/run.js ${targetFile}`, { show: true })
                }
            }
        }

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
