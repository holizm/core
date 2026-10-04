import { execFile } from 'child_process'
import { promisify } from 'util'

const execute = promisify(execFile)

export default async ({
    composePath,
    domain,
    home,
    instance,
}) => {
    let result
    try {
        if (domain) {
            if (!/^[a-z][a-zA-Z0-9]*$/.test(instance)) {
                throw new Error('Invalid deployment instance name')
            }
            result = await execute(`${home}/core/commands/connect`, [
                domain,
                `docker compose -f "$HOME/${instance}/databases/compose.yaml" config --format json`,
            ], { timeout: 30000 })
        }
        else {
            result = await execute('docker', [
                'compose',
                '-f',
                composePath,
                'config',
                '--format',
                'json',
            ], { timeout: 30000 })
        }
    }
    catch (e) {
        throw new Error(`Unable to read database Compose configuration for ${instance || composePath}`)
    }
    const compose = JSON.parse(result.stdout)
    return compose
}
