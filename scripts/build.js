import buildExclusions from './buildExclusions.js'
import buildImage from './buildImage.js'
import copySiteContent from './copySiteContent.js'
import copyComposedCode from './copyComposedCode.js'
import start from './start.js'
import stop from './stop.js'
import {
    runOnTerminal,
    runOnTerminalAsync,
    runStreaming,
} from './terminal.js'
import {
    deleteByPatterns,
    removeAndRecreateDir,
} from './os.js'
import {
    divide,
    info,
} from './logger.js'

export default async params => {
    params = await start(params)

    try {
        const {
            buildDir,
            containerName,
            isApi,
            isCiCd,
            isPanel,
            isSite,
            localBuild,
            processBuildDir,
            processPath,
            repo,
        } = params

        Object.assign(params, process.env)

        removeAndRecreateDir(buildDir)
        removeAndRecreateDir(processBuildDir)

        divide()
        info('Copying the composed code...')
        divide()

        if (isPanel) {
            await runStreaming(`docker exec ${containerName} bash -c 'node ./validatePanelUi.js && npm run build'`)

            const command = `
                docker exec ${containerName} bash -c '
                    cd '${processPath}/dist' &&
                    tar -cf - .
                ' | tar -xf - -C ${processBuildDir}
            `
            await runOnTerminalAsync(command)
        }
        else if (isSite) {
            removeAndRecreateDir(`${processBuildDir}/dist`)
            removeAndRecreateDir(`${processBuildDir}/server`)
            let command = `docker exec ${containerName} bash -c 'for attempt in {1..300}; do [ -f /tmp/siteReady ] && exit 0; sleep 1; done; exit 1'`
            await runStreaming(command)
            command = `docker exec ${containerName} bash -c 'npm run build'`
            await runStreaming(command)
            command = `
                docker exec ${containerName} bash -c '
                    cd '${processPath}/dist' &&
                    tar -cf - .
                ' | tar -xf - -C ${processBuildDir}/dist
            `
            await runOnTerminalAsync(command)
            command = `
                docker exec ${containerName} bash -c '
                    cd '${processPath}/server' &&
                    tar -cf - .
                ' | tar -xf - -C ${processBuildDir}/server
            `
            await runOnTerminalAsync(command)
            command = `docker cp ${containerName}:${processPath}/package.json ${processBuildDir}/package.json`
            if (params.siteCore === 'newSite') {
                await runOnTerminalAsync(command, { throwOnError: true })
            }
            else {
                runOnTerminal(command)
            }
        }
        else if (isApi) {
            await copyComposedCode(params)
        }

        await deleteByPatterns(params.buildDir, buildExclusions)

        if (isSite) {
            copySiteContent(params)
        }

        if (isCiCd) {
            await buildImage(params)
        }

        if (localBuild) {
            divide()
            info('Compressing...')
            divide()
            runOnTerminal(`compress ${processBuildDir}`)
        }

        return params
    }
    finally {
        await stop({ containerName: params.containerName })
    }
}
