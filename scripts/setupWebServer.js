import { replaceVariablesIfChanged } from './os.js'

export default params => {
    const {
        home,
        host,
        webServerPath,
    } = params

    const confDir = `${webServerPath}/conf.d`
    const includesDir = `${webServerPath}/includes`
    const templatePath = `${home}/core/webServer/reverseProxy`
    const includesTemplatePath = `${home}/core/webServer/proxyIncludes`
    const confFile = `${confDir}/${host}.conf`
    const includesFile = `${includesDir}/${host}`
    const configurationChanged = replaceVariablesIfChanged(templatePath, confFile, params)
    const includesChanged = replaceVariablesIfChanged(includesTemplatePath, includesFile, params)
    return configurationChanged || includesChanged
}
