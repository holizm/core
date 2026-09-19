import fs from 'node:fs'
import path from 'node:path'
import { errorAndExit } from './logger.js'

export default domain => {
    if (!domain) {
        errorAndExit('Domain is required')
    }

    const secretsPath = path.join(process.env.HOME, 'secrets')
    const matches = []

    let files
    try {
        files = fs.readdirSync(secretsPath)
    }
    catch (e) {
        errorAndExit(`Secrets directory is not accessible: ${secretsPath}`)
    }

    for (const file of files) {
        if (!file.endsWith('.json')) {
            continue
        }

        try {
            const content = fs.readFileSync(path.join(secretsPath, file), 'utf8')
            const secrets = JSON.parse(content)
            const instances = secrets.deployment?.instances

            if (!Array.isArray(instances)) {
                continue
            }

            for (const instance of instances) {
                if (instance?.domain === domain) {
                    matches.push(instance)
                }
            }
        }
        catch (e) {
            continue
        }
    }

    if (matches.length === 0) {
        errorAndExit(`No deployment instance is configured for domain ${domain}`)
    }
    if (matches.length > 1) {
        errorAndExit(`Multiple deployment instances are configured for domain ${domain}`)
    }

    return matches[0]
}
