import getApiRepo from './getApiRepo.js'
import isControlRunnable from './isControlRunnable.js'

export default ({
    home,
    process,
    repo,
}) => {
    const repoPath = `${home}/${repo}`
    const processPath = `${repoPath}/${process}`
    const commonPath = `${repoPath}/common`
    const privateSettingsPath = `${commonPath}/privateSettings.json`
    const isControl = isControlRunnable({ privateSettingsPath })
    const isControlProcess = isControl && ['controlApi', 'controlPanel'].includes(process)
    const webServerPath = `/tmp/${repo}/${process}/webServer`
    const paths = {
        certificatesPath: `${webServerPath}/certificates`,
        commonPath,
        connectionStringsPath: `${commonPath}/connectionStrings.json`,
        coreApiLock: `${home}/api/lock.json`,
        coreApiPackageJson: `${home}/api/package.json`,
        corePanelLock: `${home}/panel/lock.json`,
        corePanelPackageJson: `${home}/panel/package.json`,
        coreSiteLock: `${home}/site/lock.json`,
        coreSitePackageJson: `${home}/site/package.json`,
        dependenciesPath: `${home}/${getApiRepo(repo)}/common/dependencies`,
        essentialPartsPath: `${home}/core/essentialParts`,
        initialPath: `${commonPath}/initial.js`,
        isControl,
        isControlProcess,
        menusDirectoryPath: `${processPath}/menus`,
        migrationPath: `${home}/tmp/${repo}/migration`,
        panelLock: `${commonPath}/panelLock.json`,
        panelPackageJson: `${commonPath}/panel.json`,
        privateSettingsPath,
        processPath,
        publicSettingsPath: `${commonPath}/publicSettings.json`,
        runnableSearchablePropertiesPath: `${commonPath}/runnableSearchableProperties.json`,
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
        tenantsPath: isControlProcess
            ?
            `/tmp/${repo}/common/tenants`
            :
            `${commonPath}/tenants`,
        webServerPath,
    }
    return paths
}
