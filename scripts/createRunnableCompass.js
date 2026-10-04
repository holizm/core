import {
    existsSync,
    readFileSync,
    writeFileSync,
} from 'fs'
import createCompassConnection from './createCompassConnection.js'
import readDatabaseCompose from './readDatabaseCompose.js'

export default async ({
    home,
    isCiCd,
    repo,
}) => {
    const path = `/tmp/${repo}/databases/compass.json`
    if (isCiCd || /(?:Control|Themes)$/.test(repo) || existsSync(path)) return false
    const secrets = JSON.parse(readFileSync(`${home}/secrets/${repo}.json`, 'utf8'))
    const connections = [createCompassConnection(`${repo}.local`, await readDatabaseCompose({
        composePath: `/tmp/${repo}/databases/compose.yaml`,
    }))]
    for (const instance of secrets.deployment?.instances || []) {
        if (!instance.domain || !instance.serverDirectory) {
            throw new Error(`Invalid deployment instance for ${repo}`)
        }
        connections.push(createCompassConnection(`${instance.serverDirectory}.prod`, await readDatabaseCompose({
            domain: instance.domain,
            home,
            instance: instance.serverDirectory,
        })))
    }
    const content = {
        connections,
        type: 'Compass Connections',
        version: { $numberInt: '1' },
    }
    try {
        writeFileSync(path, `${JSON.stringify(content, null, 4)}\n`, {
            flag: 'wx',
            mode: 0o600,
        })
    }
    catch (e) {
        if (e.code === 'EEXIST') return false
        throw e
    }
    return true
}
