export default ({
    line,
    getSpecificDomain,
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
        ...params,
    })
    if (getSpecificDomain instanceof Function) {
        localDomain = getSpecificDomain(localDomain)
    }
    params = {
        ...params,
        host: localDomain,
        tenant,
    }
    createCertificate(params)
    setupNginx(params)
    setupLocalDns(params)
}
