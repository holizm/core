import fs from "fs"
import path from "path"
import { execSync } from "child_process"

export default params => {
    const {
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

    const confDir = "/etc/nginx/conf.d"
    const includesDir = "/etc/nginx/includes"
    const templatePath = "~/gesht/nginx/reverseProxy"
    const includesTemplatePath = "~/gesht/nginx/proxyIncludes"
    const confFile = path.join(confDir, `${host}.conf`)
    const includesFile = path.join(includesDir, host)

    fs.mkdirSync(confDir, { recursive: true })
    fs.mkdirSync(includesDir, { recursive: true })

    execSync(`sudo chmod 777 ${confDir}`)
    execSync(`sudo chmod 777 ${includesDir}`)

    for (const filePath of [confFile, includesFile]) {
        try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        } catch (e) {
            console.log(`Error removing ${filePath}: ${e}`)
        }
    }

    const includesTemplate = fs.readFileSync(includesTemplatePath, "utf8")
    const confTemplateRaw = fs.readFileSync(templatePath, "utf8")

    const includesContent = includesTemplate.replace(/\$(\w+)/g, (_, name) => process.env[name] || "")

    let confTemplate = confTemplateRaw.replace("$Host", host).replace("$Tenant", tenant)
    const confContent = confTemplate.replace(/\$(\w+)/g, (_, name) => process.env[name] || "")

    fs.writeFileSync(includesFile, includesContent)
    fs.writeFileSync(confFile, confContent)

    execSync("sudo nginx -s reload 1>/dev/null 2>&1")
}
