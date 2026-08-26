import {
    isFile,
    writeFileIfNotExists,
} from './os.js'

export default params => {
    const {
        commonPath,
        connectionStringsPath,
        containerHome,
        home,
        privateSettingsPath,
        process,
        processPath,
        processType,
        publicSettingsPath,
        repo,
        settingsOverridePath,
    } = params
    const hasPublicSide = ['panel', 'site'].includes(processType)
    const items = [
        [connectionStringsPath, 'connectionStrings.json'],
        [privateSettingsPath, 'privateSettings.json'],
        [publicSettingsPath, 'publicSettings.json'],
        [settingsOverridePath, 'settingsOverride.json'],
    ]
    for (const [sourcePath, filename] of items) {
        const isPublicSetting = ['publicSettings.json', 'settingsOverride.json'].includes(filename)
        const isOverride = filename === 'settingsOverride.json'
        if (isFile(sourcePath)) {
            const sourceDirectory =
                isOverride
                ?
                processPath
                :
                commonPath
            const targetDirectory =
                isPublicSetting && hasPublicSide
                ?
                'public/'
                :
                ''
            params.addVolume(`${sourceDirectory}/${filename}`, `${containerHome}/${repo}/${process}/${targetDirectory}${filename}`)
        }
    }
    const commonFile = `${home}/secrets/common.json`
    const repoFile = `${home}/secrets/${repo}.json`
    writeFileIfNotExists(commonFile, '{}')
    writeFileIfNotExists(repoFile, '{}')
    params.addVolume(commonFile, `${containerHome}/${repo}/${process}/common.json`)
    params.addVolume(repoFile, `${containerHome}/${repo}/${process}/repo.json`)
}
