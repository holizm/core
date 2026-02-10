import { info } from './logger.js'
import { removeAndRecreateDir } from './os.js'
import { runOnTerminal } from "./terminal.js"

export default params => {
    const {
        buildPath,
        processPath,
        org,
        repo,
    } = params
    info(`Copying ${org}/${repo} ...`)
    const command = `sudo cp -a ${processPath} ${buildPath}`
    info(command)
    runOnTerminal(command)
}
