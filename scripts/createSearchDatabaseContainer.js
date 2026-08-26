import getDeterministicPort from './getDeterministicPort.js'
import {
    divide,
    info,
} from './logger.js'
import {
    getContent,
    getLines,
    overrideFile,
} from './os.js'
import processTenantLines from './processTenantLines.js'
import { runOnTerminal } from './terminal.js'

const getSearchDatabaseDomain = originalDomain => `db.${originalDomain}`

const createSearchDatabaseComposeFile = params => {
    const {
        composeTemplatePath,
        repo,
    } = params
    const composePath = `/tmp/${repo}/search/compose.yaml`
    const content = getContent(composeTemplatePath)
    const substitutedContent = content.replace(/\$\{(\w+)\}/g, (_, name) => params[name] || '')
    overrideFile(composePath, substitutedContent)
    return composePath
}

const createSearchDatabaseContainer = params => {
    const {
        home,
        lowercaseRepo,
    } = params
    info('Creating search database container')
    const composePath = createSearchDatabaseComposeFile({
        ...params,
        composeTemplatePath: `${home}/core/container/composes/search`,
    })
    runOnTerminal(`docker compose -p ${lowercaseRepo}-search -f ${composePath} up -d --remove-orphans`)
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
    params.databaseSearchPort = getDeterministicPort(`${repo}SearchDatabases`)
    const lines = getLines(tenantsPath, 'utf8').filter(Boolean)

    processTenantLines({
        ...params,
        camelizedProcess: 'search',
        deterministicPort: params.databaseSearchPort,
        hosts: [`${repo}.local`],
        lines,
        pascalizedProcess: 'Search',
        process: 'search',
        // getSpecificDomain: getSearchDatabaseDomain,
    })

    divide()
    createSearchDatabaseContainer(params)
    divide()
}
