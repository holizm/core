const persistentItems = [
    '.env',
    'certificates',
    'common.json',
    'compose.yaml',
    'connectionStrings.json',
    'instance.json',
    'node_modules',
    'privateSettings.json',
    'publicSettings.json',
    'repo.json',
    'secrets.json',
    'settingsOverride.json',
    'tenants',
]

export default processPath => {
    const exclusions = persistentItems
        .map(item => `! -name '${item}'`)
        .join(' ')

    return `find ${processPath} -mindepth 1 -maxdepth 1 ${exclusions} -exec rm -rf {} +`
}
