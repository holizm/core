import buildImage from './buildImage.js'
import copyComposedCode from './copyComposedCode.js'
import start from './start.js'
import { runOnTerminal } from './terminal.js'
import {
    deleteByPatterns,
    removeAndRecreateDir,
} from './os.js'

export default async params => {
    params = await start(params)

    const {
        containerName,
        isCiCd,
        localBuild,
        processPath,
        repo,
        processBuildDir,
    } = params

    params.buildDir = '/tmp/build'
    params.processBuildDir = `${params.buildDir}/${repo}/${process}`


    Object.assign(params, process.env)

    if (localBuild) {
        removeAndRecreateDir('/tmp/buildProcessSource')
        // runOnTerminal(`docker cp ${containerName}:${processPath}/. /tmp/buildProcessSource`)
    }

    await copyComposedCode(params)

    if (isCiCd) {
        await buildImage(params)
    }

    if (localBuild) {
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
