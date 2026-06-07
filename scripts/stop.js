import { runOnTerminalAsync } from './terminal.js'
import {
    divide,
    info,
    success,
    check,
} from './logger.js'

const listContainers = async () => {
    const out = await runOnTerminalAsync('docker ps -a -q 2>&1')
    return (out || '')
        .split('\n')
        .map(x => x.trim())
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

const shouldMatch = (name, pattern) => {
    if (!pattern) return true
    return name.toLowerCase().includes(pattern.toLowerCase())
}

export default async ({ pattern = '' } = {}) => {
    const containers = await listContainers()

    let found = false

    for (const id of containers) {
        const name = await getContainerName(id)

        if (!shouldMatch(name, pattern)) continue

        if (!found) {
            divide()
            info('Stopping all ...')
            divide()
            found = true
        }

        await removeContainer(id)
        check(name)
    }

    if (!found) {
        return
    }

    await runOnTerminalAsync('docker system prune --force 2>&1')

    divide()
    success('Stopped all')
    divide()
}
