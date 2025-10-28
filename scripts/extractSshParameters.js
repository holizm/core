import { readdir } from 'fs/promises'
import { readFile } from 'fs/promises'
import { execSync } from 'child_process'

async function extractSshParams(domain) {
    if (!domain) {
        console.log('-----------------------------')
        console.error('Ssh to where? Please provide the domain name.')
        console.log('-----------------------------')
        process.exit(1)
    }

    let secretsFile = ''
    const files = await readdir('/LocalSecrets')

    for (const file of files) {
        if (!file.endsWith('.json')) continue
        const content = await readFile(`/LocalSecrets/${file}`, 'utf-8')
        let json
        try {
            json = JSON.parse(content)
        } catch {
            continue
        }

        if (json.Ssh &&
            typeof json.Ssh === 'object' &&
            Array.isArray(json.Ssh.Domains) &&
            json.Ssh.Domains.includes(domain)) {
            secretsFile = `/LocalSecrets/${file}`
            break
        }
    }

    if (!secretsFile) {
        console.error(`No secrets file found containing domain: ${domain}`)
        process.exit(1)
    }

    const data = JSON.parse(await readFile(secretsFile, 'utf-8'))
    const ssh = data.Ssh || {}

    const sshPort = ssh.Port || ''
    const sshUser = ssh.User || ''
    let sshIp = ssh.Ip || ''

    if (!sshPort || sshPort === '22') {
        console.error(`Invalid SSH port. Specify a non-default port in ${secretsFile}.`)
        process.exit(1)
    }

    if (!sshUser || sshUser.length !== 20) {
        console.error('Invalid SSH user. It must be exactly 20 characters long.')
        process.exit(1)
    }

    if (!sshIp) {
        try {
            sshIp = execSync(`getent ahosts ${domain} | awk '{print $1; exit}'`).toString().trim()
        } catch {
            sshIp = ''
        }
        if (!sshIp) {
            console.error(`Failed to resolve IP for domain: ${domain}`)
            process.exit(1)
        }
    }

    return { sshPort, sshUser, sshIp }
}
