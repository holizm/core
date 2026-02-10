import { info } from './logger.js'
import { isDir, removeAndRecreateDir } from './os.js'
import { runOnTerminal } from "./terminal.js"

export default params => {
    const {
        buildPath,
        directory,
        home,
        repoPath,
    } = params
    info(`Copying ${home}/${directory} ...`)
    let command = `cp -r ${home}/${directory} ${buildPath}`
    if (isDir(`${repoPath}/${directory}`)) {
        command = `cp -r ${repoPath}/${directory} ${buildPath}`
    }
    info(command)
    runOnTerminal(command)
}
