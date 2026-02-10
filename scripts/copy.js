import { info } from './logger.js'
import { isDir, removeAndRecreateDir } from './os.js'
import { runOnTerminal } from "./terminal.js"

export default params => {
    const {
        buildPath,
        repoPath,
        home,
        repo,
    } = params
    info(`Copying ${home}/${repo} ...`)
    let command = `cp -r ${home}/${repo} ${buildPath}`
    if (isDir(`${repoPath}/${repo}`)) {
        command = `cp -r ${repoPath}/${repo} ${buildPath}`
    }
    info(command)
    runOnTerminal(command)
}
