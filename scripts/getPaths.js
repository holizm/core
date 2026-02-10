export default ({
    home,
    process,
    repo,
}) => {
    const repoPath = `${home}/${repo}`
    const processPath = `${repoPath}/${process}`
    const commonPath = `${repoPath}/common`
    const paths = {
        apiLock: `${commonPath}/apiLock.json`,
        apiPackageJson: `${commonPath}/api.json`,
        buildPath: `/tmp/build/${repo}/${process}`,
        commonPath,
        connectionStringsPath: `${commonPath}/connectionStrings.json`,
        dependenciesPath: `${commonPath}/dependencies`,
        essentialPartsPath: `${home}/core/essentialParts`,
        initialPath: `${commonPath}/initial.js`,
        menusDirectoryPath: `${processPath}/menus`,
        migrationPath: `${home}/tmp/${repo}/migration`,
        panelLock: `${commonPath}/panelLock.json`,
        panelPackageJson: `${commonPath}/panel.json`,
        privateSettingsPath: `${commonPath}/privateSettings.json`,
        processPath,
        processPath: `${processPath}`,
        publicSettingsPath: `${commonPath}/publicSettings.json`,
        repoPath,
        settingsOverridePath: `${processPath}/settingsOverride.json`,
        siteFilePath: `${processPath}/site`,
        siteLock: `${commonPath}/siteLock.json`,
        sitePackageJson: `${commonPath}/site.json`,
        tenantsPath: `${commonPath}/tenants`,
    }
    return paths
}
