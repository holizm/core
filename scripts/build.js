import buildImage from './buildImage.js'
import copyComposedCode from './copyComposedCode.js'
import start from './start.js'
import { runOnTerminal } from './terminal.js'
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
        isCiCd,
        localBuild,
        processBuildDir,
        processPath,
        repo,
    } = params

    Object.assign(params, process.env)

    if (localBuild) {
        removeAndRecreateDir('/tmp/buildProcessSource')
        // runOnTerminal(`docker cp ${containerName}:${processPath}/. /tmp/buildProcessSource`)
    }

    divide()
    info('Copying the composed code...')
    divide()
    await copyComposedCode(params)

    if (isCiCd) {
        await buildImage(params)
    }

    if (localBuild) {
        divide()
        info('Compressing...')
        divide()
        runOnTerminal(`compress ${processBuildDir}`)
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

    return params
}
