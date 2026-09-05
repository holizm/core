import getDeterministicPort from './getDeterministicPort.js'
import getHeadlessRepo from './getHeadlessRepo.js'
import { info } from './logger.js'
import {
    getContent,
    isFile,
    overrideFile,
} from './os.js'
import prepareComposeFile from './prepareComposeFile.js'
import { runOnTerminalAsync } from './terminal.js'

const isEnabled = privateSettingsPath => {
    if (!isFile(privateSettingsPath)) {
        return false
    }

    const privateSettings = JSON.parse(getContent(privateSettingsPath))
    return privateSettings.enableCacheServer === true
}

const createComposeFile = params => {
    const {
        composeTemplatePath,
        repo,
    } = params
    const composePath = `/tmp/${repo}/cacheServer/compose.yaml`
    const content = getContent(composeTemplatePath)
    const substitutedContent = content.replace(/\$\{(\w+)\}/g, (_, name) => params[name] || '')
    overrideFile(composePath, substitutedContent)
    return composePath
}

export default params => {
    const {
        home,
        isCiCd,
        localBuild,
        lowercaseRepo,
        privateSettingsPath,
        repo,
    } = params
    if (
        isCiCd ||
        localBuild ||
        (!params.isApi && !params.isSite) ||
        !isEnabled(privateSettingsPath)
    ) {
        return
    }

    info('Creating cache server container')
    const headlessRepo = getHeadlessRepo(repo)
    const composePath = createComposeFile({
        ...params,
        cacheServerName: `${headlessRepo}Cache`,
        cacheServerPort: getDeterministicPort(`${headlessRepo}Cache`),
        composeTemplatePath: `${home}/core/container/composes/cacheServer`,
    })
    prepareComposeFile(composePath)
    params.addContainerStartupTask('start cache server container', () => runOnTerminalAsync(
        `docker compose -p ${lowercaseRepo}-cache-server -f ${composePath} up -d --remove-orphans`,
        {
            throwOnError: true,
        },
    ))
}
