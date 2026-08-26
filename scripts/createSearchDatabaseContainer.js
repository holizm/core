import { runOnTerminal } from './terminal.js'
import getDeterministicPort from './getDeterministicPort.js'
import { divide, info } from './logger.js'
import processTenantLine from './processTenantLine.js'
import {
    getContent,
    getLines,
    isFile,
    overrideFile,
} from './os.js'
import setupLocalDns from './setupLocalDns.js'

const getSearchDatabaseDomain = originalDomain => `db.${originalDomain}`

const createSearchDatabaseComposeFile = params => {
    const {
        repo,
        composeTemplatePath,
    } = params
    const composePath = `/tmp/${repo}/search/compose.yaml`
    const content = getContent(composeTemplatePath)
    const substituted = content.replace(/\$\{(\w+)\}/g, (_, name) => params[name] || '')
    overrideFile(composePath, substituted)
    return composePath
}

const createSearchDatabaseContainer = params => {
    const {
        home,
        lowercaseRepo,
    } = params
    info('Creating search database container')
    const path = createSearchDatabaseComposeFile({
        ...params,
        composeTemplatePath: `${home}/core/container/composes/search`
    })
    runOnTerminal(`docker compose -p ${lowercaseRepo}-search -f ${path} up -d --remove-orphans`)
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
    params.databaseSearchPort = getDeterministicPort(`${repo}SearchDatabases`)
    const lines = getLines(tenantsPath, 'utf8').filter(Boolean)

    lines.forEach(line => processTenantLine({
        ...params,
        process: 'search',
        camelizedProcess: 'search',
        pascalizedProcess: 'Search',
        deterministicPort: params.databaseSearchPort,
        line,
        // getSpecificDomain: getSearchDatabaseDomain,
    }))

    divide()
    createSearchDatabaseContainer(params)
    divide()
}
