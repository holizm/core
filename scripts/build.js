import buildImage from './buildImage.js'
import copyComposedCode from './copyComposedCode.js'
import start from './start.js'
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

    if (localBuild) {
        removeAndRecreateDir('/tmp/buildProcessSource')
        // runOnTerminal(`docker cp ${containerName}:${processPath}/. /tmp/buildProcessSource`)
    }

    if (isPanel) {
        divide()
        info('Building the panel...')
        divide()
        await runStreaming(`docker exec ${containerName} bash -c 'npm run build'`)

        divide()
        info('Copying the built output...')
        divide()
        const command = `
            docker exec ${containerName} bash -c '
                cd '${processPath}/dist' &&
                tar -cf - .
            ' | tar -xf - -C ${processBuildDir}
        `
        await runOnTerminalAsync(command)
    }
    else {
        divide()
        info('Copying the composed code...')
        divide()
        await copyComposedCode(params)
    }

    await deleteByPatterns(params.buildDir, [
        '**/.vscode',
        '**/*.yaml',
        '**/ast',
        '**/certificates',
        '**/common.json',
        '**/connectionStrings.json',
        '**/corePackage.json',
        '**/privateSettings.json',
        '**/publicSettings.json',
        '**/repo.json',
        '**/secrets.json',
        '**/settingsOverride.json',
    ])

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
