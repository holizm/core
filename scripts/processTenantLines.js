import createCertificate from './createCertificate.js'
import processTenantLine from './processTenantLine.js'
import setupLocalDns from './setupLocalDns.js'
import setupWebServer from './setupWebServer.js'
import { measure } from './timing.js'

export default params => {
    const {
        hosts,
        lines,
        ...rest
    } = params
    const tenantParams = measure('tenants: parse tenant lines', () => lines.map(line => processTenantLine({
        ...rest,
        line,
    })))
    const tenantHosts = tenantParams.map(tenant => tenant.host)
    measure('tenants: configure local DNS', () => setupLocalDns({
        hosts: [
            ...hosts,
            ...tenantHosts,
        ],
    }))
    let webServerChanged = false
    for (const tenant of tenantParams) {
        const certificateChanged = measure(`tenant ${tenant.tenant}: create certificate`, () => createCertificate(tenant))
        const configurationChanged = measure(`tenant ${tenant.tenant}: configure web server`, () => setupWebServer(tenant))
        webServerChanged = webServerChanged || certificateChanged || configurationChanged
    }
    return webServerChanged
}
