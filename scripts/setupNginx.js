import { getFileContent } from "./os.js"
import { runOnTerminal } from "./terminal.js"

export default params => {
    const {
        home,
        host,
        tenant,
        repo,
        process,
    } = params

    params.nginxParamsServerName = "$server_name"
    params.nginxParamsRequestUri = "$request_uri"
    params.nginxHostParameter = "$host"
    params.nginxSchemeParameter = "$scheme"
    params.nginxForParameter = "$proxy_add_x_forwarded_for"
    params.nginxHttpUpgradeParameter = "$http_upgrade"
    params.nginxParamsSubdomain = "$subdomain"
    params.multitenant = "$multitenant"

    const confDir = `${home}/conf.d`
    const includesDir = `${home}/includes`
    const templatePath = "~/gesht/nginx/reverseProxy"
    const includesTemplatePath = "~/gesht/nginx/proxyIncludes"
    const confFile = `${confDir}/${host}.conf`
    const includesFile = `${includesDir}/${host}`

    const includesTemplate = getFileContent(includesTemplatePath)
    const confTemplateRaw = getFileContent(templatePath)

    const includesContent = includesTemplate.replace(/\$(\w+)/g, (_, name) => params[name] || "")

    let confTemplate = confTemplateRaw.replace("$host", host).replace("$tenant", tenant)
    const confContent = confTemplate.replace(/\$(\w+)/g, (_, name) => params[name] || "")

    writeFile(includesFile, includesContent)
    writeFile(confFile, confContent)

    runOnTerminal("sudo nginx -t && sudo systemctl reload nginx 1>/dev/null 2>&1")
}
