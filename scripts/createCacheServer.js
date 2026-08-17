import getDeterministicPort from './getDeterministicPort.js'
import { info } from './logger.js'
import {
    getContent,
    isFile,
    overrideFile,
} from './os.js'
import { runOnTerminal } from './terminal.js'

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
    const substituted = content.replace(/\$\{(\w+)\}/g, (_, name) => params[name] || '')
    overrideFile(composePath, substituted)
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
        !isEnabled(privateSettingsPath)
    ) {
        return
    }
    info('Creating cache server container')
    const composePath = createComposeFile({
        ...params,
        cacheServerPort: getDeterministicPort(`${repo}CacheServer`),
        composeTemplatePath: `${home}/core/container/composes/cacheServer`,
    })
    runOnTerminal(`docker compose -p ${lowercaseRepo}-cache-server -f ${composePath} up -d --remove-orphans`)
}
