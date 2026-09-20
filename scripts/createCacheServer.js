import getDeterministicPort from './getDeterministicPort.js'
import {
    divide,
    errorAndExit,
    info,
} from './logger.js'
import {
    getContent,
    isFile,
    overrideFile,
} from './os.js'
import prepareComposeFile from './prepareComposeFile.js'
import { runOnTerminalAsync } from './terminal.js'

const getCacheSettings = ({
    home,
    privateSettingsPath,
}) => {
    const privateSettings = isFile(privateSettingsPath)
        ?
        JSON.parse(getContent(privateSettingsPath))
        :
        {}
    const commonSettingsPath = `${home}/secrets/common.json`
    const commonSettings = isFile(commonSettingsPath)
        ?
        JSON.parse(getContent(commonSettingsPath))
        :
        {}
    const cacheSettings = {
        enabled: commonSettings.cache?.enabled
            ?? commonSettings.enableCacheServer
            ?? privateSettings.cache?.enabled
            ?? privateSettings.enableCacheServer,
        serverPassword: commonSettings.cache?.serverPassword
            ?? commonSettings.cacheServerPassword
            ?? privateSettings.cache?.serverPassword
            ?? privateSettings.cacheServerPassword,
    }
    return cacheSettings
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

const ensureCacheServerContainer = async params => {
    const {
        composePath,
        lowercaseRepo,
    } = params
    divide()
    info('Ensuring cache server container')
    await runOnTerminalAsync(
        `docker compose -p ${lowercaseRepo}-cache-server -f ${composePath} up -d --remove-orphans`,
        {
            throwOnError: true,
        },
    )
    divide()
}

export default params => {
    const {
        home,
        isCiCd,
        localBuild,
        networkRepo,
        privateSettingsPath,
    } = params
    const cacheSettings = getCacheSettings({
        home,
        privateSettingsPath,
    })
    if (
        isCiCd ||
        localBuild ||
        (!params.isApi && !params.isSite) ||
        cacheSettings.enabled !== true
    ) {
        return
    }
    if (!cacheSettings.serverPassword) {
        errorAndExit('cache.serverPassword is required when cache.enabled is true')
    }

    const cacheServerName = `${networkRepo}Cache`
    const composePath = createComposeFile({
        ...params,
        cacheServerPassword: cacheSettings.serverPassword,
        cacheServerPort: getDeterministicPort(cacheServerName),
        composeTemplatePath: `${home}/core/container/composes/cacheServer`,
        repo: networkRepo,
    })
    prepareComposeFile(composePath)
    params.addContainerStartupTask('ensure cache server container', () => ensureCacheServerContainer({
        composePath,
        lowercaseRepo: networkRepo.toLowerCase(),
    }))
}
