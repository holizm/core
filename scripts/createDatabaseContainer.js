import {
    divide,
    info,
} from '../scripts/logger.js'
import getDeterministicPort from './getDeterministicPort.js'
import {
    getContent,
    getLines,
    overrideFile,
} from './os.js'
import processTenantLines from './processTenantLines.js'
import { runOnTerminal } from './terminal.js'

const getDatabaseDomain = originalDomain => `db.${originalDomain}`

const createDatabaseComposeFile = params => {
    const {
        composeTemplatePath,
        repo,
    } = params
    const composePath = `/tmp/${repo}/databases/compose.yaml`
    const content = getContent(composeTemplatePath)
    const substitutedContent = content.replace(/\$\{(\w+)\}/g, (_, name) => params[name] || '')
    overrideFile(composePath, substitutedContent)
    return composePath
}

const createMongoDatabaseContainer = params => {
    const {
        home,
        lowercaseRepo,
    } = params
    info('Creating database container')
    const composePath = createDatabaseComposeFile({
        ...params,
        composeTemplatePath: `${home}/core/container/composes/database`,
    })
    runOnTerminal(`docker compose -p ${lowercaseRepo}-databases -f ${composePath} up -d --remove-orphans`)
}

export default params => {
    const {
        isCiCd,
        repo,
        tenantsPath,
    } = params
    if (isCiCd) {
        return
    }
    params.databaseEnginePort = getDeterministicPort(repo)
    const lines = getLines(tenantsPath, 'utf8').filter(Boolean)
    const webServerChanged = processTenantLines({
        ...params,
        getSpecificDomain: getDatabaseDomain,
        hosts: [`${repo}.local`],
        lines,
    })

    divide()
    createMongoDatabaseContainer(params)
    divide()
    return webServerChanged
}
