import buildImage from './buildImage.js'
import copyComposedCode from './copyComposedCode.js'
import start from './start.js'
import { runOnTerminal } from './terminal.js'
import {
    deleteByPatterns,
    removeAndRecreateDir,
} from './os.js'

export default async overrides => {
    const params = await start({
        ...overrides,
        localBuild: true,
    })

    const {
        containerName,
        isCiCd,
        localBuild,
        processPath,
        repo,
    } = params

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
        runOnTerminal(`compress /tmp/build/${repo}/${params.process}`)
    }

    await deleteByPatterns('/tmp/build', [
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
