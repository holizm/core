export default () => {
    const repository = process.env.repository
    const processName = process.env.process
    if (!repository || !processName)
        throw "Both 'repository' and 'process' environment variables must be set"

    process.env.commonPath = `/${repository}/common`
    process.env.connectionStringsPath = `/${repository}/common/connectionStrings.json`
    process.env.dependenciesPath = `/${repository}/common/dependencies`
    process.env.initialPath = `/${repository}/common/initial.sql`
    process.env.menusDirectoryPath = `/${repository}/${processName}/menus`
    process.env.migrationPath = `/tmp/${repository}/migration`
    process.env.privateSettingsPath = `/${repository}/common/privateSettings.json`
    process.env.processPath = `/${repository}/${processName}`
    process.env.publicSettingsPath = `/${repository}/common/publicSettings.json`
    process.env.settingsOverridePath = `/${repository}/${processName}/settingsOverride.json`
    process.env.tenantsPath = `/${repository}/common/tenants`
}
