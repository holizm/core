import changePermissions from './changePermissions.js'
import createCacheServer from './createCacheServer.js'
import createNetwork from './createNetwork.js'
import ensureDependencies from './ensureDependencies.js'
import ensurePathExistsOrCreateIt from './ensurePathExistsOrCreateIt.js'
import ensureTenants from './ensureTenants.js'
import extract from './extract.js'
import getDeterministicPort from './getDeterministicPort.js'
import getDependencies from './getDependencies.js'
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
import processTenantLines from './processTenantLines.js'
import startAccounts from './startAccounts.js'
import startApi from './startApi.js'
import startHeadlessPanel from './startHeadlessPanel.js'
import startPanel from './startPanel.js'
import startSite from './startSite.js'
import {
    initializeTimings,
    measure,
    measureAsync,
    writeTimings,
} from './timing.js'
import stop from './stop.js'
import {
    runOnTerminal,
    runStreaming,
} from './terminal.js'

export default async overrides => {
    initializeTimings()
    let params = measure('extract startup parameters', () => ({
        ...extract(),
        ...overrides,
    }))

    await measureAsync('stop existing process containers', () => stop({
        pattern: params.containerName,
    }))

    params.isCiCd = params.isCiCd || process.env.isCiCd === 'true'
    params.userLine =
        params.isCiCd
        ?
        `user: "1001:1001"`
        :
        ''
    params.buildDir = '/tmp/build'
    params.processBuildDir = `${params.buildDir}/${params.repo}/${params.process}`

    params = measure('resolve paths and port', () => ({
        ...params,
        ...getPaths(params),
        deterministicPort: getDeterministicPort(params.containerName),
    }))

    const { tenantsPath } = params

    measure('ensure tenants', () => ensureTenants(params))

    const lines = measure('read tenants', () => getLines(tenantsPath))

    if (!params.isCiCd) {
        measure('configure tenant infrastructure', () => processTenantLines({
            ...params,
            hosts: [],
            lines,
        }))
    }

    measure('create Docker network', () => createNetwork(params))
    measure('ensure dependencies', () => ensureDependencies(params))
    params.dependencies = measure('calculate dependencies', () => getDependencies(params))

    params.composeFile = `/tmp/${params.repo}/${params.process}/compose.yaml`
    params.imageName = `ghcr.io/${params.lowercaseOrg}/${params.lowercaseRepo}/${params.lowercaseProcess}:latest`

    params.volumes = []

    params.addVolume = (left, right) => {
        measure('ensure bind mount source', () => ensurePathExistsOrCreateIt(left))
        params.volumes.push({ left, right })
    }

    params.joinVolumes = () => measure('compose volume mappings', () => {
        params.volumes.sort((a, b) => a.left.localeCompare(b.left))

        params.volumes =
            '\n' +
            params.volumes
                .map(volume => `${indentation}- ${volume.left}:${volume.right}`)
                .join('\n')
    })

    measure('configure process', () => {
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
    })

    measure('create cache server', () => createCacheServer(params))
    measure('change permissions', () => changePermissions(params))

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
        writeTimings(`/tmp/${params.repo}/${params.process}/startTimings.md`)
        await runStreaming(command)
        return params
    }

    measure('start process container', () => runOnTerminal(command, {
        show: true,
        throwOnError: true,
    }))

    writeTimings(`/tmp/${params.repo}/${params.process}/startTimings.md`)

    if (params.isCiCd || params.localBuild) {
        info(`In CI/CD or local build, we don't show the log of the container.`)
    }
    else {
        command = `${composeCommand} logs -f`

        await runStreaming(command)
    }

    return params
}
