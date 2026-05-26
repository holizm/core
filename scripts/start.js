import {
    divide,
    info,
    warning,
} from './logger.js'
import {
    append,
    getLines,
    isAccounts,
    isApi,
    isHeadlessPanel,
    isPanel,
    isSite,
    isWorker,
} from './os.js'
import {
    runOnTerminal,
    runStreaming,
} from './terminal.js'
import getPaths from './getPaths.js'
import getRandomPort from './getRandomPort.js'
import createNetwork from './createNetwork.js'
import ensureDependencies from './ensureDependencies.js'
import startApi from './startApi.js'
import startPanel from './startPanel.js'
import startSite from './startSite.js'
import processTenantLine from './processTenantLine.js'
import extract from './extract.js'
import indentation from './indentation.js'
import ensurePathExistsOrCreateIt from './ensurePathExistsOrCreateIt.js'
import changePermissions from './changePermissions.js'
import ensureTenants from './ensureTenants.js'

export default async overrides => {
    let params = {
        ...extract(),
        ...overrides,
    }

    params.isCiCd = params.isCiCd || process.env.isCiCd === 'true'
    params.userLine = params.isCiCd ? `user: "1001:1001"` : ''

    params = {
        ...params,
        ...getPaths(params),
        ...getRandomPort(),
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
        startNodeApi(params)
    }
    else {
        warning('Unknown process')
    }

    changePermissions(params)

    let command = `docker compose -p ${params.lowercaseRepo}-${params.lowercaseProcess} -f ${params.composeFile} up --remove-orphans -d`

    runOnTerminal(command)

    if (params.isCiCd || params.build) {
        info(`In CI/CD or local build, we don't show the log of the container.`)
    }
    else {
        command = `docker compose -p ${params.lowercaseRepo}-${params.lowercaseProcess} -f ${params.composeFile} logs -f`

        await runStreaming(command)
    }

    return params
}
