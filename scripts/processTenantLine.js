import getLocalHost from './getLocalHost.js'
import { errorAndExit } from './logger.js'

export default ({
    getSpecificDomain,
    line,
    ...rest
}) => {
    const parts = line.trim().split(/\s+/)
    let defaultLocale
    let domain
    let locales
    let roles
    let tenant

    if (parts.length === 5) {
        [
            tenant,
            domain,
            locales,
            defaultLocale,
            roles,
        ] = parts
        roles = roles.split(',')
    }
    else if (parts.length === 4) {
        [
            tenant,
            domain,
            locales,
            defaultLocale,
        ] = parts
        roles = []
    }
    else {
        errorAndExit(`Incomplete tenant line: ${line}`)
    }

    let localDomain = getLocalHost({
        ...rest,
        domain,
    })
    if (getSpecificDomain instanceof Function) {
        localDomain = getSpecificDomain(localDomain)
    }

    const params = {
        ...rest,
        host: localDomain,
        tenant,
    }
    return params
}
