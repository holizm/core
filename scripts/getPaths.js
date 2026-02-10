export default ({
    home,
    process,
    repo,
}) => {
    const repoPath = `${home}/${repo}`
    const processPath = `${repoPath}/${process}`
    const commonPath = `${repoPath}/common`
    const paths = {
        buildPath: `/tmp/build`,
        commonPath,
        connectionStringsPath: `${commonPath}/connectionStrings.json`,
        coreApiLock: `${home}/api/lock.json`,
        coreApiPackageJson: `${home}/api/package.json`,
        corePanelLock: `${home}/panel/lock.json`,
        corePanelPackageJson: `${home}/panel/package.json`,
        coreSiteLock: `${home}/site/lock.json`,
        coreSitePackageJson: `${home}/site/package.json`,
        dependenciesPath: `${commonPath}/dependencies`,
        essentialPartsPath: `${home}/core/essentialParts`,
        initialPath: `${commonPath}/initial.js`,
        menusDirectoryPath: `${processPath}/menus`,
        migrationPath: `${home}/tmp/${repo}/migration`,
        panelLock: `${commonPath}/panelLock.json`,
        panelPackageJson: `${commonPath}/panel.json`,
        privateSettingsPath: `${commonPath}/privateSettings.json`,
        processPath,
        publicSettingsPath: `${commonPath}/publicSettings.json`,
        repoPath,
        runnableApiLock: `${commonPath}/apiLock.json`,
        runnableApiPackageJson: `${commonPath}/apiPackage.json`,
        runnablePanelLock: `${commonPath}/panelLock.json`,
        runnablePanelPackageJson: `${commonPath}/panelPackage.json`,
        runnableSiteLock: `${commonPath}/siteLock.json`,
        runnableSitePackageJson: `${commonPath}/sitePackage.json`,
        settingsOverridePath: `${processPath}/settingsOverride.json`,
        siteFilePath: `${processPath}/site`,
        siteLock: `${commonPath}/siteLock.json`,
        sitePackageJson: `${commonPath}/site.json`,
        tenantsPath: `${commonPath}/tenants`,
    }
    return paths
}
