import { info } from './logger.js'
import { removeAndRecreateDir } from './os.js'
import { runOnTerminal } from "./terminal.js"

export default params => {
    const {
        buildPath,
        home,
        repo,
    } = params
    info(`Copying ${home}/${repo} ...`)
    const command = `cp -r ${home}/${repo} ${buildPath}`
    info(command)
    runOnTerminal(command)
}
