import { X509Certificate } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'
import isFile from './isFile.js'
import { createDirIfNotExists } from './os.js'
import { runOnTerminalAsync } from './terminal.js'

export default async params => {
    const {
        certificatesPath,
        host,
        tenant,
    } = params
    const basePath = join(certificatesPath, tenant)
    const certPath = join(basePath, 'certificate.pem')
    const keyPath = join(basePath, 'key.pem')
    let hosts = [host]

    if (isFile(certPath) && isFile(keyPath)) {
        try {
            const certificate = new X509Certificate(readFileSync(certPath))
            const existingHosts = [...(certificate.subjectAltName || '').matchAll(/DNS:([^,\s]+)/g)]
                .map(match => match[1])
            hosts = [...new Set([...existingHosts, host])]
            if (certificate.checkHost(host) && Date.parse(certificate.validTo) > Date.now()) {
                await runOnTerminalAsync(`openssl verify -CAfile "$(mkcert -CAROOT)/rootCA.pem" "${certPath}"`, {
                    throwOnError: true,
                })
                return false
            }
        }
        catch (e) {
            void e
        }
    }

    createDirIfNotExists(basePath)
    const command = `mkcert -cert-file ${certPath} -key-file ${keyPath} ${hosts.join(' ')}`
    await runOnTerminalAsync(command, {
        throwOnError: true,
    })
    return true
}
