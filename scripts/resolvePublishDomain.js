import fs from 'node:fs'
import path from 'node:path'
import { errorAndExit } from './logger.js'

export default repo => {
    const secretsPath = path.join(process.env.HOME, 'secrets')
    let instances = []

    try {
        const files = fs.readdirSync(secretsPath)
        for (const file of files) {
            if (!file.endsWith('.json')) {
                continue
            }

            try {
                const content = fs.readFileSync(path.join(secretsPath, file), 'utf8')
                const secrets = JSON.parse(content)
                if (secrets.deployment?.vcsRepo === repo) {
                    instances.push(...(secrets.deployment.instances || []))
                }
            }
            catch (e) {
                continue
            }
        }
    }
    catch (e) {
        errorAndExit(`Secrets directory is not accessible: ${secretsPath}`)
    }

    if (instances.length === 0) {
        errorAndExit(`No deployment instance is configured for ${repo}`)
    }
    if (instances.length > 1) {
        errorAndExit(`Multiple deployment instances are configured for ${repo}. Provide a domain.`)
    }

    const domain = instances[0].domain
    if (!domain) {
        errorAndExit(`The deployment instance for ${repo} has no domain`)
    }

    return domain
}
