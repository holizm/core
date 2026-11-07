import { info } from '../scripts/logger.js'
import { runOnTerminal } from './terminal.js'

export default params => {
    const { networkRepo } = params
    const networkName = `${networkRepo}Network`
    const networkNames = runOnTerminal('docker network ls --format {{.Name}}').split('\n')
    if (!networkNames.includes(networkName)) {
        info(`Creating the network ${networkName}`)
        runOnTerminal(`docker network create --driver bridge ${networkName}`, {
            show: false,
            throwOnError: true,
        })
    }
    const networkId = runOnTerminal(`docker network inspect ${networkName} --format '{{.Id}}'`, {
        throwOnError: true,
    })
    const containerIds = runOnTerminal('docker ps -aq', { throwOnError: true })
    if (!containerIds) {
        return
    }
    const containers = JSON.parse(runOnTerminal(`docker inspect ${containerIds.split('\n').join(' ')}`, {
        throwOnError: true,
    }))
    for (const container of containers) {
        const network = container.NetworkSettings?.Networks?.[networkName]
        if (!network || network.NetworkID === networkId) {
            continue
        }
        const aliases = (network.Aliases || []).map(alias => `--alias '${alias}'`).join(' ')
        runOnTerminal(`docker network disconnect --force ${networkName} ${container.Id}`, {
            throwOnError: true,
        })
        runOnTerminal(`docker network connect ${aliases} ${networkName} ${container.Id}`, {
            throwOnError: true,
        })
    }
}
