import createCertificate from './createCertificate.js'
import processTenantLine from './processTenantLine.js'
import setupLocalDns from './setupLocalDns.js'
import setupWebServer from './setupWebServer.js'
import {
    measure,
    measureAsync,
} from './timing.js'

export default async params => {
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
    const configurationChanges = tenantParams.map(tenant => measure(
        `tenant ${tenant.tenant}: configure web server`,
        () => setupWebServer(tenant),
    ))
    const certificateChanges = await Promise.all(tenantParams.map(tenant => measureAsync(
        `tenant ${tenant.tenant}: create certificate`,
        () => createCertificate(tenant),
    )))
    return [
        ...certificateChanges,
        ...configurationChanges,
    ].some(Boolean)
}
