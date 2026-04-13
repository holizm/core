import { error } from '../scripts/logger.js'
import { getContent } from './os.js'
import { runOnTerminal } from './terminal.js'

export default (propertyName = 'randomPort') => {
    const [lowerPort, upperPort] = getContent('/proc/sys/net/ipv4/ip_local_port_range')
        .trim()
        .split(/\s+/)
        .map(Number)

    let port
    while (true) {
        port = Math.floor(Math.random() * (upperPort - lowerPort + 1)) + lowerPort
        try {
            const result = runOnTerminal('ss -lpn').toString()
            if (!result.includes(`:${port} `)) {
                break
            }
        } catch (err) {
            error('Error checking port usage:', err)
            break
        }
    }

    const result = {}
    result[propertyName] = port.toString()
    return result
}
