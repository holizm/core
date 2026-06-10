import { errorAndExit } from './logger.js'
import createCertificate from './createCertificate.js'
import getLocalHost from './getLocalHost.js'
import setupLocalDns from './setupLocalDns.js'
import setupWebServer from './setupWebServer.js'

export default ({
    line,
    getSpecificDomain,
    ...rest
}) => {
    const parts = line.trim().split(/\s+/)
    let tenant, domain, locales, defaultLocale, roles
    if (parts.length === 5) {
        [tenant, domain, locales, defaultLocale, roles] = parts
        roles = roles.split(',')
    } else if (parts.length === 4) {
        [tenant, domain, locales, defaultLocale] = parts
        roles = []
    } else {
        errorAndExit(`Incomplete tenant line: ${line}`)
    }
    let localDomain = getLocalHost({
        domain,
        ...rest,
    })
    if (getSpecificDomain instanceof Function) {
        localDomain = getSpecificDomain(localDomain)
    }
    let params = {
        ...rest,
        host: localDomain,
        tenant,
    }
    createCertificate(params)
    setupWebServer(params)
    setupLocalDns(params)
}
