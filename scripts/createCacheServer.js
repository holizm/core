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
    return {
        ...privateSettings,
        ...commonSettings,
    }
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
        privateSettingsPath,
        repo,
    } = params
    const cacheSettings = getCacheSettings({
        home,
        privateSettingsPath,
    })
    if (
        isCiCd ||
        localBuild ||
        (!params.isApi && !params.isSite) ||
        cacheSettings.enableCacheServer !== true
    ) {
        return
    }
    if (!cacheSettings.cacheServerPassword) {
        errorAndExit('cacheServerPassword is required when enableCacheServer is true')
    }

    const cacheServerName = `${repo}Cache`
    const composePath = createComposeFile({
        ...params,
        cacheServerPassword: cacheSettings.cacheServerPassword,
        cacheServerPort: getDeterministicPort(cacheServerName),
        composeTemplatePath: `${home}/core/container/composes/cacheServer`,
    })
    prepareComposeFile(composePath)
    params.addContainerStartupTask('ensure cache server container', () => ensureCacheServerContainer({
        composePath,
        lowercaseRepo: repo.toLowerCase(),
    }))
}
