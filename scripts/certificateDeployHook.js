#!/usr/bin/env node

import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import {
    error,
    info,
    success,
} from './logger.js'

const lineage = process.env.RENEWED_LINEAGE
const extractSshParametersPath = '/home/dev/core/scripts/extractSshParameters.js'

const run = (command, args, options = {}) => execFileSync(command, args, {
    stdio: 'inherit',
    ...options,
})

try {
    if (!lineage) throw new Error('RENEWED_LINEAGE is required')

    const domain = path.basename(lineage)
    const sshParameters = execFileSync('node', [extractSshParametersPath, domain], {
        encoding: 'utf8',
        env: {
            ...process.env,
            HOME: '/home/dev',
        },
    }).trim()
    const [sshPort, , sshIp] = sshParameters.split(/\s+/)
    const target = `root@${sshIp}`
    const remoteTempPath = `/tmp/certificateDeploy-${domain}-${process.pid}`
    const remoteLivePath = `/etc/letsencrypt/live/${domain}`
    const remoteArchivePath = `/etc/letsencrypt/archive/${domain}`
    const files = ['cert.pem', 'chain.pem', 'fullchain.pem', 'privkey.pem']
    const localFiles = Object.fromEntries(files.map(file => [
        file,
        fs.realpathSync(path.join(lineage, file)),
    ]))
    const sshArgs = ['-p', sshPort, target]
    const scpArgs = ['-P', sshPort]

    info(`Deploying certificate for ${domain}`)
    run('ssh', [...sshArgs, `mkdir -p '${remoteTempPath}' && chmod 700 '${remoteTempPath}'`])

    try {
        for (const file of files) {
            run('scp', [...scpArgs, localFiles[file], `${target}:${remoteTempPath}/${file}`])
        }

        const installCommand = `
set -eu
rm -rf '${remoteArchivePath}' '${remoteLivePath}'
mkdir -p '${remoteArchivePath}' '${remoteLivePath}'
mv '${remoteTempPath}/cert.pem' '${remoteArchivePath}/cert1.pem'
mv '${remoteTempPath}/chain.pem' '${remoteArchivePath}/chain1.pem'
mv '${remoteTempPath}/fullchain.pem' '${remoteArchivePath}/fullchain1.pem'
mv '${remoteTempPath}/privkey.pem' '${remoteArchivePath}/privkey1.pem'
ln -s '../../archive/${domain}/cert1.pem' '${remoteLivePath}/cert.pem'
ln -s '../../archive/${domain}/chain1.pem' '${remoteLivePath}/chain.pem'
ln -s '../../archive/${domain}/fullchain1.pem' '${remoteLivePath}/fullchain.pem'
ln -s '../../archive/${domain}/privkey1.pem' '${remoteLivePath}/privkey.pem'
chmod 644 '${remoteArchivePath}/cert1.pem' '${remoteArchivePath}/chain1.pem' '${remoteArchivePath}/fullchain1.pem'
chmod 600 '${remoteArchivePath}/privkey1.pem'
rmdir '${remoteTempPath}'
nginx -t
nginx -s reload
`

        run('ssh', [...sshArgs, installCommand])
    } catch (exception) {
        try {
            run('ssh', [...sshArgs, `rm -rf '${remoteTempPath}'`], { stdio: 'ignore' })
        } catch {}
        throw exception
    }

    success(`Certificate deployed for ${domain}`)
} catch (exception) {
    error(exception)
    process.exitCode = 1
}
