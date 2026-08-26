import { info } from '../scripts/logger.js'
import { runOnTerminal } from './terminal.js'

export default params => {
    const { repo } = params
    const networkName = `${repo}Network`
    const networkNames = runOnTerminal('docker network ls --format {{.Name}}').split('\n')
    if (!networkNames.includes(networkName)) {
        info(`Creating the network ${networkName}`)
        runOnTerminal(`docker network create --driver bridge ${networkName}`, {
            show: false,
            throwOnError: true,
        })
    }
}
