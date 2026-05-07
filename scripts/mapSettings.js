import {
    isFile,
    writeFileIfNotExists,
} from './os.js'

export default params => {
    let {
        commonPath,
        connectionStringsPath,
        privateSettingsPath,
        publicSettingsPath,
        settingsOverridePath,
        home,
        process,
        processPath,
        processType,
        repo,
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
        if (isFile(sourcePath))
            params.addVolume(`${isOverride ? processPath : commonPath}/${filename}`, `${containerHome}/${repo}/${process}/${isPublicSetting && hasPublicSide ? 'public/' : ''}${filename}`)
    }
    const commonFile = `${home}/secrets/common.json`
    const repoFile = `${home}/secrets/${repo}.json`
    writeFileIfNotExists(commonFile, '{}')
    writeFileIfNotExists(repoFile, '{}')
    params.addVolume(commonFile, `${containerHome}/${repo}/${process}/common.json`)
    params.addVolume(repoFile, `${containerHome}/${repo}/${process}/repo.json`)
}
