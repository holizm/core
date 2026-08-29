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
import { runOnTerminalAsync } from './terminal.js'

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

const createSearchDatabaseContainer = async params => {
    const {
        home,
        lowercaseRepo,
    } = params
    info('Creating search database container')
    const composePath = createSearchDatabaseComposeFile({
        ...params,
        composeTemplatePath: `${home}/core/container/composes/search`,
    })
    await runOnTerminalAsync(`docker compose -p ${lowercaseRepo}-search -f ${composePath} up -d --remove-orphans`, {
        throwOnError: true,
    })
}

export default async params => {
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

    const webServerChanged = processTenantLines({
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
    await createSearchDatabaseContainer(params)
    divide()
    return webServerChanged
}
