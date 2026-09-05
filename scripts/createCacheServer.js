import getDeterministicPort from './getDeterministicPort.js'
import getHeadlessRepo from './getHeadlessRepo.js'
import {
    divide,
    info,
} from './logger.js'
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

const ensureCacheServerContainer = async params => {
    const {
        cacheServerName,
        composePath,
        lowercaseHeadlessRepo,
    } = params
    const runningCacheServerContainer = await runOnTerminalAsync(`docker ps -q -f name=${cacheServerName}`)
    if (runningCacheServerContainer.trim()) {
        info('Cache server container is running')
        return
    }
    const exitedCacheServerContainer = await runOnTerminalAsync(`docker ps -aq -f status=exited -f name=${cacheServerName}`)
    if (exitedCacheServerContainer.trim()) {
        await runOnTerminalAsync(`docker rm ${cacheServerName}`, {
            throwOnError: true,
        })
    }
    divide()
    info('Creating cache server container')
    await runOnTerminalAsync(
        `docker compose -p ${lowercaseHeadlessRepo}-cache-server -f ${composePath} up -d --remove-orphans`,
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
    if (
        isCiCd ||
        localBuild ||
        (!params.isApi && !params.isSite) ||
        !isEnabled(privateSettingsPath)
    ) {
        return
    }

    const headlessRepo = getHeadlessRepo(repo)
    const cacheServerName = `${headlessRepo}Cache`
    const composePath = createComposeFile({
        ...params,
        cacheServerName,
        cacheServerPort: getDeterministicPort(cacheServerName),
        composeTemplatePath: `${home}/core/container/composes/cacheServer`,
    })
    prepareComposeFile(composePath)
    params.addContainerStartupTask('ensure cache server container', () => ensureCacheServerContainer({
        cacheServerName,
        composePath,
        lowercaseHeadlessRepo: headlessRepo.toLowerCase(),
    }))
}
