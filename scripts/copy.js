import { info } from './logger.js'
import { removeAndRecreateDir } from './os.js'
import { runOnTerminal } from "./terminal.js"

export default params => {
    const {
        home,
        org,
        process,
        repo,
    } = params
    info(`Copying ${org}/${repo} ...`)
    removeAndRecreateDir(`/tmp/build/${repo}/${process}`)
    const command = `sudo cp -r ${home}/${repo}/${process} /tmp/build/${repo}/${process}`
    info(command)
    // runOnTerminal()
}
