import createCertificate from './createCertificate.js'
import processTenantLine from './processTenantLine.js'
import reloadWebServer from './reloadWebServer.js'
import setupLocalDns from './setupLocalDns.js'
import setupWebServer from './setupWebServer.js'

export default params => {
    const {
        hosts,
        lines,
        ...rest
    } = params
    const tenantParams = lines.map(line => processTenantLine({
        ...rest,
        line,
    }))
    const tenantHosts = tenantParams.map(tenant => tenant.host)
    setupLocalDns({
        hosts: [
            ...hosts,
            ...tenantHosts,
        ],
    })
    for (const tenant of tenantParams) {
        createCertificate(tenant)
        setupWebServer(tenant)
    }
    if (tenantParams.length > 0) {
        reloadWebServer()
    }
}
