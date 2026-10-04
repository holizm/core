import { lookup } from 'dns/promises'
import { readFileSync } from 'fs'
import setupLocalDns from './setupLocalDns.js'

export default async params => {
    const {
        home,
        repo,
    } = params
    if (params.isCiCd || /(?:Control|Themes)$/.test(repo)) return false
    const secrets = JSON.parse(readFileSync(`${home}/secrets/${repo}.json`, 'utf8'))
    const hosts = [`${repo}.local`]
    for (const instance of secrets.deployment?.instances || []) {
        if (!instance.serverDirectory || !instance.domain) {
            throw new Error(`Invalid deployment instance for ${repo}`)
        }
        const ip = secrets.ssh?.ip && secrets.ssh?.domains?.includes(instance.domain)
            ?
            secrets.ssh.ip
            :
            (await lookup(instance.domain, { family: 4 })).address
        hosts.push({
            host: `${instance.serverDirectory}.prod`,
            ip,
        })
    }
    return setupLocalDns({ hosts })
}
