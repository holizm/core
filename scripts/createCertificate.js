import { join } from 'node:path'
import getPaths from './getPaths.js'
import {
    createDirIfNotExists,
    isFile,
} from './os.js'
import { runOnTerminalAsync } from './terminal.js'

export default async params => {
    const {
        certificatesPath,
        host,
        tenant,
    } = {
        ...params,
        ...getPaths(params),
    }
    const basePath = join(certificatesPath, tenant)
    const certPath = join(basePath, 'certificate.pem')
    const keyPath = join(basePath, 'key.pem')

    if (isFile(certPath) && isFile(keyPath)) {
        return false
    }

    createDirIfNotExists(basePath)
    const command = `mkcert -cert-file ${certPath} -key-file ${keyPath} ${host} 2>/dev/null`
    await runOnTerminalAsync(command, {
        throwOnError: true,
    })
    return true
}
