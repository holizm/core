import isControlRunnable from './isControlRunnable.js'
import isFile from './isFile.js'
import {
    writeFile,
    writeFileIfNotExists,
} from './os.js'

export default params => {
    const {
        connectionStringsPath,
        containerHome,
        home,
        privateSettingsPath,
        process,
        processType,
        publicSettingsPath,
        repo,
        settingsOverridePath,
    } = params
    const hasPublicSide = ['panel', 'site'].includes(processType)
    const isControl = isControlRunnable(params)
    const items = [
        [connectionStringsPath, 'connectionStrings.json'],
        [privateSettingsPath, 'privateSettings.json'],
        [publicSettingsPath, 'publicSettings.json'],
        [settingsOverridePath, 'settingsOverride.json'],
    ]
    for (const [sourcePath, filename] of items) {
        const isPublicSetting = ['publicSettings.json', 'settingsOverride.json'].includes(filename)
        const resolvedPath = isFile(sourcePath)
            ?
            sourcePath
            :
            isControl
                ?
                `/tmp/${repo}/${process}/settings/${filename}`
                :
                null
        if (resolvedPath) {
            if (!isFile(sourcePath)) writeFile(resolvedPath, '{}\n')
            const targetDirectory =
                isPublicSetting && hasPublicSide
                ?
                'public/'
                :
                ''
            params.addVolume(resolvedPath, `${containerHome}/${repo}/${process}/${targetDirectory}${filename}`)
        }
    }
    const commonFile = `${home}/secrets/common.json`
    const repoFile = `${home}/secrets/${repo}.json`
    writeFileIfNotExists(commonFile, '{}')
    writeFileIfNotExists(repoFile, '{}')
    params.addVolume(commonFile, `${containerHome}/${repo}/${process}/common.json`)
    params.addVolume(repoFile, `${containerHome}/${repo}/${process}/repo.json`)
}
