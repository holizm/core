import fs from 'fs'
import { execSync } from 'child_process'
import { errorAndExit } from './logger.js'

export default domain => {
    if (!domain) {
        divide()
        errorAndExit('Ssh to where? Please provide the domain name.')
        divide()
    }

    let secretsFile = ''
    const dir = '/LocalSecrets'
    try {
        const entries = fs.readdirSync(dir)
        for (const file of entries) {
            if (!file.endsWith('.json')) continue
            const fullPath = `${dir}/${file}`
            let raw
            let parsed
            try {
                raw = fs.readFileSync(fullPath, 'utf8')
                parsed = JSON.parse(raw)
            } catch {
                continue
            }

            if (
                parsed &&
                typeof parsed === 'object' &&
                parsed.ssh &&
                typeof parsed.ssh === 'object' &&
                Array.isArray(parsed.ssh.domains) &&
                parsed.ssh.domains.includes(domain)
            ) {
                secretsFile = fullPath
                break
            }
        }
    } catch {
        // directory missing or unreadable -> will trigger 'no secrets file' below
    }

    if (!secretsFile) {
        error(`No secrets file found containing domain: ${domain}`)
        process.exit(1)
    }

    let fileContent
    try {
        fileContent = fs.readFileSync(secretsFile, 'utf8')
    } catch {
        error(`Failed to read secrets file: ${secretsFile}`)
        process.exit(1)
    }

    let json
    try {
        json = JSON.parse(fileContent)
    } catch {
        error(`Invalid JSON in secrets file: ${secretsFile}`)
        process.exit(1)
    }

    const sshObj =
        json && typeof json === 'object' && json.ssh && typeof json.ssh === 'object'
            ? json.ssh
            : {}

    let sshPort = sshObj.port !== undefined && sshObj.port !== null ? String(sshObj.port).trim() : ''
    let sshUser = sshObj.user !== undefined && sshObj.user !== null ? String(sshObj.user).trim() : ''
    let sshIp = sshObj.ip !== undefined && sshObj.ip !== null ? String(sshObj.ip).trim() : ''

    if (!sshPort || sshPort === '22') {
        error(`Invalid SSH port. Specify a non-default port in ${secretsFile}.`)
        process.exit(1)
    }

    if (!sshUser || sshUser.length !== 20) {
        error('Invalid SSH user. It must be exactly 20 characters long.')
        process.exit(1)
    }

    if (!sshIp) {
        try {
            sshIp = execSync(`getent ahosts '${domain}' | awk '{print $1; exit}'`).toString().trim()
        } catch {
            // ignore, handled below
        }

        if (!sshIp) {
            error(`Failed to resolve IP for domain: ${domain}`)
            process.exit(1)
        }
    }

    global.sshPort = sshPort
    global.sshUser = sshUser
    global.sshIp = sshIp
}
