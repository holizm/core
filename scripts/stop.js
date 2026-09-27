import {
    check,
    divide,
    info,
    success,
} from './logger.js'
import matchesContainer from './matchesContainer.js'
import { runOnTerminalAsync } from './terminal.js'

const listContainers = async () => {
    const out = await runOnTerminalAsync('docker ps -a -q 2>&1')
    return (out || '')
        .split('\n')
        .map(id => id.trim())
        .filter(Boolean)
}

const getContainerName = async id => {
    const out = await runOnTerminalAsync(`docker inspect ${id} 2>&1`)
    const match = out.match(/"Name":\s*"\/([^"]+)"/i)
    return match?.[1] || ''
}

const removeContainer = async id => {
    await runOnTerminalAsync(`docker rm ${id} --force 2>&1`)
}

export default async (params = {}) => {
    const containers = await listContainers()
    const selector = params.containerName || params.pattern || 'all'

    let found = false

    for (const id of containers) {
        const name = await getContainerName(id)

        if (!matchesContainer(name, params)) {
            continue
        }

        if (!found) {
            divide()
            info(`Stopping ${selector} ...`)
            divide()
            found = true
        }

        await removeContainer(id)
        check(name)
    }

    if (!found) {
        return
    }

    if (!params.containerName) {
        await runOnTerminalAsync('docker system prune --force 2>&1')
    }

    divide()
    success(`Stopped ${selector}`)
    divide()
}
