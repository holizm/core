import createCacheServer from './createCacheServer.js'
import createNetwork from './createNetwork.js'
import ensureDependencies from './ensureDependencies.js'
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
import prepareComposeFile from './prepareComposeFile.js'
import reloadWebServer from './reloadWebServer.js'
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
    runOnTerminalAsync,
    runStreaming,
} from './terminal.js'

const startContainers = params => Promise.all(params.containerStartupTasks.map(containerStartupTask => measureAsync(
    containerStartupTask.task,
    containerStartupTask.callback,
)))

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
    params.buildDir = `/tmp/build/${params.repo}/${params.process}`
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
        params.webServerChanged = await measureAsync('configure tenant infrastructure', () => processTenantLines({
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
    params.containerStartupTasks = []

    params.addContainerStartupTask = (task, callback) => {
        params.containerStartupTasks.push({
            callback,
            task,
        })
    }

    params.addVolume = (left, right) => {
        if (!left || !right) {
            throw new Error('Bind mount source and target are required')
        }
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

    measure('register cache server container', () => createCacheServer(params))

    const composeCommand = `docker compose -p ${params.lowercaseRepo}-${params.lowercaseProcess} -f ${params.composeFile}`
    const shouldWatch = params.isSite && !params.isCiCd && !params.localBuild
    const composeMode =
        shouldWatch
        ?
        '--watch'
        :
        '-d'
    let command = `${composeCommand} up --remove-orphans ${composeMode}`
    measure('prepare Compose bind mounts', () => prepareComposeFile(params.composeFile))

    if (shouldWatch) {
        await startContainers(params)
        measure('reload web server', () => reloadWebServer(params))
        writeTimings(`/tmp/${params.repo}/${params.process}/startReport.md`)
        await runStreaming(command)
        return params
    }

    params.addContainerStartupTask('start process container', () => runOnTerminalAsync(command, {
        throwOnError: true,
    }))
    await startContainers(params)

    if (!params.isCiCd) {
        measure('reload web server', () => reloadWebServer(params))
    }

    writeTimings(`/tmp/${params.repo}/${params.process}/startReport.md`)

    const processUsesApiContainer = params.isApi || params.isWorker
    const processUsesInteractiveContainer = processUsesApiContainer || params.isPanel
    const internalStartCommand = processUsesApiContainer
        ?
        `${params.containerHome}/core/commands/api/start`
        :
        `${params.containerHome}/core/commands/panel/start`
    if (processUsesApiContainer && params.localBuild) {
        await measureAsync('start API container process', () => runOnTerminalAsync(
            `docker exec -d ${params.containerName} bash -c ${internalStartCommand}`,
            {
                throwOnError: true,
            },
        ))
    }

    if (params.isCiCd || params.localBuild) {
        info(`In CI/CD or local build, we don't show the log of the container.`)
    }
    else if (processUsesInteractiveContainer) {
        await runStreaming(`node ${params.home}/core/commands/enter ${params.containerName} ${internalStartCommand}`)
    }
    else {
        command = `${composeCommand} logs -f`

        await runStreaming(command)
    }

    return params
}
