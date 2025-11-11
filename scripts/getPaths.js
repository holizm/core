export default ({
    home,
    process,
    repo,
}) => {
    const paths = {
        apiPackageJson: `${home}/${repo}/common/api.json`,
        commonPath: `${home}/${repo}/common`,
        connectionStringsPath: `${home}/${repo}/common/connectionStrings.json`,
        dependenciesPath: `${home}/${repo}/common/dependencies`,
        essentialPartsPath: `${home}/core/essentialParts`,
        initialPath: `${home}/${repo}/common/initial.sql`,
        menusDirectoryPath: `${home}/${repo}/${process}/menus`,
        migrationPath: `${home}/tmp/${repo}/migration`,
        packageLock: `${home}/${repo}/${process}/packageLock.json`,
        panelPackageJson: `${home}/${repo}/common/panel.json`,
        privateSettingsPath: `${home}/${repo}/common/privateSettings.json`,
        processPath: `${home}/${repo}/${process}`,
        publicSettingsPath: `${home}/${repo}/common/publicSettings.json`,
        settingsOverridePath: `${home}/${repo}/${process}/settingsOverride.json`,
        siteFilePath: `${home}/${repo}/${process}/site`,
        sitePackageJson: `${home}/${repo}/common/site.json`,
        tenantsPath: `${home}/${repo}/common/tenants`,
    }
    return paths
}
