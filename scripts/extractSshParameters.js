import fs from 'fs'
import { execSync } from 'child_process'
import {
    error,
    errorAndExit,
} from './logger.js'
import { getContent } from './os.js'

const domain = process.argv[2]
const home = process.env.HOME

if (!domain) {
    errorAndExit('Missing domain. Please provide a domain name as an argument.')
}

let secretsFile = ''
const dir = `${home}/secrets`
try {
    const entries = fs.readdirSync(dir)
    for (const file of entries) {
        if (!file.endsWith('.json')) continue
        const fullPath = `${dir}/${file}`
        let raw
        let parsed
        try {
            raw = getContent(fullPath)
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
    errorAndExit(`Secrets directory not accessible: ${dir}`)
}

if (!secretsFile) {
    errorAndExit(`No secrets file found containing domain: ${domain}`)
}

let fileContent
try {
    fileContent = getContent(secretsFile)
} catch {
    errorAndExit(`Unable to read secrets file: ${secretsFile}`)
}

let json
try {
    json = JSON.parse(fileContent)
} catch {
    errorAndExit(`Invalid JSON format in secrets file: ${secretsFile}`)
}

const sshObj =
    json && typeof json === 'object' && json.ssh && typeof json.ssh === 'object'
        ? json.ssh
        : {}

let sshPort = sshObj.port !== undefined && sshObj.port !== null ? String(sshObj.port).trim() : ''
let sshUser = sshObj.user !== undefined && sshObj.user !== null ? String(sshObj.user).trim() : ''
let sshIp = sshObj.ip !== undefined && sshObj.ip !== null ? String(sshObj.ip).trim() : ''

if (!sshPort || sshPort === '22') {
    errorAndExit(`Invalid SSH port in ${secretsFile}. Please set a custom port.`)
}

if (!sshUser || sshUser.length !== 20) {
    errorAndExit('Invalid SSH username. It must be exactly 20 characters long.')
}

if (!sshIp) {
    try {
        sshIp = execSync(`getent ahosts '${domain}' | awk '{print $1; exit}'`).toString().trim()
    } catch {
        // ignore, handled below
    }

    if (!sshIp) {
        errorAndExit(`Unable to resolve IP address for domain: ${domain}`)
    }
}

console.log(`${sshPort} ${sshUser} ${sshIp}`)
