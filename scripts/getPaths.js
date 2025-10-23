export default ({
    repo,
    process,
}) => {
    const paths = {
        commonPath: `/${repo}/common`,
        connectionStringsPath: `/${repo}/common/connectionStrings.json`,
        dependenciesPath: `/${repo}/common/dependencies`,
        initialPath: `/${repo}/common/initial.sql`,
        menusDirectoryPath: `/${repo}/${process}/menus`,
        migrationPath: `/tmp/${repo}/migration`,
        privateSettingsPath: `/${repo}/common/privateSettings.json`,
        processPath: `/${repo}/${process}`,
        publicSettingsPath: `/${repo}/common/publicSettings.json`,
        settingsOverridePath: `/${repo}/${process}/settingsOverride.json`,
        tenantsPath: `/${repo}/common/tenants`,
    }
    return paths
}
