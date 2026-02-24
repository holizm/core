import { runOnTerminal } from './terminal.js'
import getDeterministicPort from './getDeterministicPort.js'
import { divide, info } from '../scripts/logger.js'
import processTenantLine from "./processTenantLine.js"
import {
    getFileContent,
    getFileLines,
    isFile,
    overrideFile,
} from "./os.js"
import setupLocalDns from "./setupLocalDns.js"

const getDatabaseDomain = originalDomain => `db.${originalDomain}`

const createDatabaseComposeFile = params => {
    const {
        repo,
        composeTemplatePath,
    } = params
    const composePath = `/tmp/${repo}/databases/compose.yaml`
    const content = getFileContent(composeTemplatePath)
    const substituted = content.replace(/\$\{(\w+)\}/g, (_, name) => params[name] || '')
    overrideFile(composePath, substituted)
    return composePath
}

const createMongoDatabaseContainer = params => {
    const {
        home,
        lowercaseRepo,
    } = params
    info('Creating database container')
    const path = createDatabaseComposeFile({
        ...params,
        composeTemplatePath: `${home}/core/container/composes/database`
    })
    runOnTerminal(`docker compose -p ${lowercaseRepo}-databases -f ${path} up -d --remove-orphans`)
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
    setupLocalDns({
        ...params,
        host: `${repo}.local`,
    })
    params.databaseEnginePort = getDeterministicPort(repo)
    const lines = getFileLines(tenantsPath, 'utf8').filter(Boolean)
    lines.forEach(line => processTenantLine({
        ...params,
        line,
        getSpecificDomain: getDatabaseDomain,
    }))

    divide()
    createMongoDatabaseContainer(params)
    divide()
}
