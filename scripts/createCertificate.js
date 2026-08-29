import { join } from 'path'
import { isFile } from './os.js'
import { runOnTerminal } from './terminal.js'

export default params => {
    const {
        host,
        process,
        repo,
        tenant,
    } = params
    const basePath = join('/tmp', repo, process, 'certificates', tenant)
    const certPath = join(basePath, 'certificate.pem')
    const keyPath = join(basePath, 'key.pem')

    if (isFile(certPath) && isFile(keyPath)) {
        return false
    }

    runOnTerminal(`mkdir -p ${basePath}`)
    const command = `mkcert -cert-file ${certPath} -key-file ${keyPath} ${host} 2>/dev/null`
    runOnTerminal(command)
    return true
}
