import crypto from 'crypto'
import { errorAndExit } from '../scripts/logger.js'
import { getContent } from './os.js'

export default seed => {
    if (!seed) {
        errorAndExit('A deterministic port requires a stable seed, such as a repository and process name.')
    }

    const [
        lowerPort,
        upperPort,
    ] = getContent('/proc/sys/net/ipv4/ip_local_port_range')
        .trim()
        .split(/\s+/)
        .map(Number)
    const hash = crypto.createHash('md5').update(seed).digest('hex')
    const numericHash = parseInt(hash.slice(0, 8), 16)
    const deterministicPort = lowerPort + (numericHash % (upperPort - lowerPort))

    return deterministicPort
}
