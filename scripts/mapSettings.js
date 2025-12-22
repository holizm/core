import { isFile } from './os.js'

export default params => {
    let {
        commonPath,
        connectionStringsPath,
        privateSettingsPath,
        publicSettingsPath,
        settingsOverridePath,
        home,
        process,
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
        if (isFile(sourcePath))
            params.addVolume(`${commonPath}/${filename}`, `/${repo}/${process}/${isPublicSetting && hasPublicSide ? 'public/' : ''}${filename}`)
    }
    const commonFile = `${home}/secrets/common.json`
    const repoFile = `${home}/secrets/${repo}.json`
    writeFileIfNotExists(commonFile, '{}')
    writeFileIfNotExists(repoFile, '{}')
    params.addVolume(commonFile, `/${repo}/${process}/common.json`)
    params.addVolume(repoFile, `/${repo}/${process}/repo.json`)
}
