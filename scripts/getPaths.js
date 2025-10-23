export default ({
    home,
    process,
    repo,
}) => {
    const paths = {
        commonPath: `${home}/${repo}/common`,
        connectionStringsPath: `${home}/${repo}/common/connectionStrings.json`,
        dependenciesPath: `${home}/${repo}/common/dependencies`,
        initialPath: `${home}/${repo}/common/initial.sql`,
        menusDirectoryPath: `${home}/${repo}/${process}/menus`,
        migrationPath: `${home}/tmp/${repo}/migration`,
        privateSettingsPath: `${home}/${repo}/common/privateSettings.json`,
        processPath: `${home}/${repo}/${process}`,
        publicSettingsPath: `${home}/${repo}/common/publicSettings.json`,
        settingsOverridePath: `${home}/${repo}/${process}/settingsOverride.json`,
        tenantsPath: `${home}/${repo}/common/tenants`,
    }
    return paths
}
