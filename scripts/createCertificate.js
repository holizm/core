import { join } from 'path'
import { runOnTerminal } from './terminal.js'
import { isFile } from './os.js'

export default params => {
    const {
        host,
        tenant,
        repo,
        process,
    } = params
    const basePath = join('/tmp', repo, process, 'certificates', tenant)
    const certPath = join(basePath, 'certificate.pem')
    const keyPath = join(basePath, 'key.pem')
    if (isFile(certPath) && isFile(keyPath)) return
    runOnTerminal(`mkdir -p ${basePath}`)
    const command = `mkcert -cert-file ${certPath} -key-file ${keyPath} ${host} 2>/dev/null`
    runOnTerminal(command)
}
