const fs = require('fs')
const { execSync } = require('child_process')

export default (envVarName = 'randomPort') => {
    const [lowerPort, upperPort] = fs.readFileSync('/proc/sys/net/ipv4/ip_local_port_range', 'utf-8')
        .trim()
        .split(/\s+/)
        .map(Number)

    let port
    while (true) {
        port = Math.floor(Math.random() * (upperPort - lowerPort + 1)) + lowerPort
        try {
            const result = execSync('ss -lpn').toString()
            if (!result.includes(`:${port} `)) {
                break
            }
        } catch (err) {
            console.error('Error checking port usage:', err)
            break
        }
    }

    process.env[envVarName] = port.toString()
    return port
}
