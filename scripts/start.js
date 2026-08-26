import changePermissions from './changePermissions.js'
import createCacheServer from './createCacheServer.js'
import createNetwork from './createNetwork.js'
import ensureDependencies from './ensureDependencies.js'
import ensurePathExistsOrCreateIt from './ensurePathExistsOrCreateIt.js'
import ensureTenants from './ensureTenants.js'
import extract from './extract.js'
import getDeterministicPort from './getDeterministicPort.js'
import getPaths from './getPaths.js'
import indentation from './indentation.js'
import {
    divide,
    info,
    warning,
} from './logger.js'
import {
    getLines,
    isAccounts,
    isApi,
    isHeadlessPanel,
    isPanel,
    isSite,
    isWorker,
} from './os.js'
import processTenantLine from './processTenantLine.js'
import startAccounts from './startAccounts.js'
import startApi from './startApi.js'
import startHeadlessPanel from './startHeadlessPanel.js'
import startPanel from './startPanel.js'
import startSite from './startSite.js'
import stop from './stop.js'
import {
    runOnTerminal,
    runStreaming,
} from './terminal.js'

export default async overrides => {
    let params = {
        ...extract(),
        ...overrides,
    }

    await stop({
        pattern: params.containerName,
    })

    params.isCiCd = params.isCiCd || process.env.isCiCd === 'true'
    params.userLine =
        params.isCiCd
        ?
        `user: "1001:1001"`
        :
        ''
    params.buildDir = '/tmp/build'
    params.processBuildDir = `${params.buildDir}/${params.repo}/${params.process}`

    params = {
        ...params,
        ...getPaths(params),
        deterministicPort: getDeterministicPort(params.containerName),
    }

    const { tenantsPath } = params

    ensureTenants(params)

    const lines = getLines(tenantsPath)

    if (!params.isCiCd) {
        lines.forEach(line =>
            processTenantLine({
                ...params,
                line,
            })
        )
    }

    createNetwork(params)
    ensureDependencies(params)

    params.composeFile = `/tmp/${params.repo}/${params.process}/compose.yaml`
    params.imageName = `ghcr.io/${params.lowercaseOrg}/${params.lowercaseRepo}/${params.lowercaseProcess}:latest`

    params.volumes = []

    params.addVolume = (left, right) => {
        ensurePathExistsOrCreateIt(left)
        params.volumes.push({ left, right })
    }

    params.joinVolumes = () => {
        params.volumes.sort((a, b) => a.left.localeCompare(b.left))

        params.volumes =
            '\n' +
            params.volumes
                .map(volume => `${indentation}- ${volume.left}:${volume.right}`)
                .join('\n')
    }

    if (isAccounts(params)) {
        params.isAccounts = true
        startAccounts(params)
    }
    else if (isApi(params)) {
        params.isApi = true
        startApi(params)
    }
    else if (isPanel(params)) {
        params.isPanel = true

        if (isHeadlessPanel(params)) {
            params.isHeadlessPanel = true
            startHeadlessPanel(params)
        }
        else {
            startPanel(params)
        }
    }
    else if (isSite(params)) {
        params.isSite = true
        startSite(params)
    }
    else if (isWorker(params)) {
        params.isWorker = true
        startApi(params)
    }
    else {
        warning('Unknown process')
    }

    createCacheServer(params)
    changePermissions(params)

    const composeCommand = `docker compose -p ${params.lowercaseRepo}-${params.lowercaseProcess} -f ${params.composeFile}`
    const shouldWatch = params.isSite && !params.isCiCd && !params.localBuild
    const composeMode =
        shouldWatch
        ?
        '--watch'
        :
        '-d'
    let command = `${composeCommand} up --remove-orphans ${composeMode}`

    if (shouldWatch) {
        await runStreaming(command)
        return params
    }

    runOnTerminal(command, {
        show: true,
        throwOnError: true,
    })

    if (params.isCiCd || params.localBuild) {
        info(`In CI/CD or local build, we don't show the log of the container.`)
    }
    else {
        command = `${composeCommand} logs -f`

        await runStreaming(command)
    }

    return params
}
