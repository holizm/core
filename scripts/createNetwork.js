import { info } from "../logger.js"
import { runOnTerminal } from "./terminal.js"

export default params => {
    const {
        repo,
    } = params
    const networkName = `${repo}Network`
    const output = runOnTerminal('docker network ls --format {{.Name}}').split('\n')
    if (!output.includes(networkName)) {
        info(`Creating the network ${networkName}`)
        runOnTerminal(`docker network create --driver bridge ${networkName} 1>/dev/null 2>&1`)
    }
}
