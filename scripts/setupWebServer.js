import { replaceVariablesIfChanged } from './os.js'

export default params => {
    const {
        home,
        host,
        locales,
        webServerPath,
    } = params

    const confDir = `${webServerPath}/conf.d`
    const includesDir = `${webServerPath}/includes`
    const templatePath = `${home}/core/webServer/reverseProxy`
    const includesTemplatePath = `${home}/core/webServer/proxyIncludes`
    const localesRegex = locales
        .split(',')
        .filter(Boolean)
        .join('|')
    const templateParams = {
        ...params,
        localesRegex,
    }
    const confFile = `${confDir}/${host}.conf`
    const includesFile = `${includesDir}/${host}`
    const configurationChanged = replaceVariablesIfChanged(templatePath, confFile, templateParams)
    const includesChanged = replaceVariablesIfChanged(includesTemplatePath, includesFile, templateParams)
    return configurationChanged || includesChanged
}
