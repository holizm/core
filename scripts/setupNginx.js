import { replaceVariables } from "./os.js"
import { runOnTerminal } from "./terminal.js"

export default params => {
    const {
        home,
        host,
    } = params

    const confDir = `${home}/nginx/conf.d`
    const includesDir = `${home}/nginx/includes`
    const templatePath = `${home}/core/webServer/reverseProxy`
    const includesTemplatePath = `${home}/core/webServer/proxyIncludes`
    const confFile = `${confDir}/${host}.conf`
    const includesFile = `${includesDir}/${host}`

    replaceVariables(templatePath, confFile, params)
    replaceVariables(includesTemplatePath, includesFile, params)

    runOnTerminal("sudo nginx -t && sudo systemctl reload nginx 1>/dev/null 2>&1")
}
