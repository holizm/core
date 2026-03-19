import crypto from 'crypto'
import { getContent } from "./os.js"
import { error, errorAndExit } from "../scripts/logger.js"

export default seed => {
    if (!seed) {
        errorAndExit("Deterministic port can not be created without a seed.")
    }
    const [lowerPort, upperPort] = getContent('/proc/sys/net/ipv4/ip_local_port_range').split(/\s+/).map(Number)
    const hashVal = crypto.createHash('md5').update(seed).digest('hex')
    const intHash = parseInt(hashVal.slice(0, 8), 16)
    const randomDeterministicPort = lowerPort + (intHash % (upperPort - lowerPort))
    return randomDeterministicPort
}

