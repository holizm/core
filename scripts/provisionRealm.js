import realmMapper from './realmMapper.js'
import { getRealmClients } from './realmConfiguration.js'

export default async (request, configuration) => {
    const configuredRealmPath = `realms/${encodeURIComponent(configuration.realm)}`
    let realm = await request('GET', configuredRealmPath, undefined, true)
    if (!realm) {
        await request('POST', 'realms', {
            enabled: true,
            realm: configuration.realm,
        })
        realm = await request('GET', configuredRealmPath)
    }
    if (!realm?.realm) throw new Error('Keycloak did not return the realm name')
    const realmPath = `realms/${encodeURIComponent(realm.realm)}`
    for (const name of configuration.roles) {
        const role = await request('GET', `${realmPath}/roles/${encodeURIComponent(name)}`, undefined, true)
        if (!role) {
            await request('POST', `${realmPath}/roles`, { name })
        }
    }
    for (const desired of getRealmClients(configuration)) {
        const clientPath = `${realmPath}/clients?clientId=${encodeURIComponent(desired.clientId)}`
        let client = (await request('GET', clientPath)).find(item => item.clientId === desired.clientId)
        if (!client) {
            await request('POST', `${realmPath}/clients`, desired)
            client = (await request('GET', clientPath)).find(item => item.clientId === desired.clientId)
            if (!client) throw new Error(`Created client ${desired.clientId} was not found`)
        }
        else if (Object.entries(desired).some(([key, value]) => JSON.stringify(client[key]) !== JSON.stringify(value))) {
            await request('PUT', `${realmPath}/clients/${client.id}`, {
                ...desired,
                id: client.id,
            })
        }
        const mapperPath = `${realmPath}/clients/${client.id}/protocol-mappers/models`
        const mappers = await request('GET', mapperPath)
        const existingMapper = mappers.find(mapper => mapper.name === realmMapper.name)
        if (!existingMapper) await request('POST', mapperPath, realmMapper)
        else if (existingMapper.protocolMapper !== realmMapper.protocolMapper ||
            Object.entries(realmMapper.config).some(([key, value]) => existingMapper.config?.[key] !== value)) {
            await request('PUT', `${mapperPath}/${existingMapper.id}`, {
                ...existingMapper,
                ...realmMapper,
            })
        }
    }
    const adminClients = await request('GET', `${realmPath}/clients?clientId=adminApi`)
    const adminClient = adminClients.find(client => client.clientId === 'adminApi')
    if (!adminClient) throw new Error('adminApi client was not found')
    const serviceUser = await request('GET', `${realmPath}/clients/${adminClient.id}/service-account-user`)
    const managementClients = await request('GET', `${realmPath}/clients?clientId=realm-management`)
    const management = managementClients.find(client => client.clientId === 'realm-management')
    if (!management) throw new Error('realm-management client was not found')
    const adminRole = await request('GET', `${realmPath}/clients/${management.id}/roles/realm-admin`)
    const assigned = await request('GET', `${realmPath}/users/${serviceUser.id}/role-mappings/clients/${management.id}`)
    if (!assigned.some(role => role.id === adminRole.id)) {
        await request('POST', `${realmPath}/users/${serviceUser.id}/role-mappings/clients/${management.id}`, [adminRole])
    }
    const siteClients = await request('GET', `${realmPath}/clients?clientId=site`)
    const siteClient = siteClients.find(client => client.clientId === 'site')
    if (!siteClient) throw new Error('site client was not found')
    const adminCredential = await request('GET', `${realmPath}/clients/${adminClient.id}/client-secret`)
    const siteCredential = await request('GET', `${realmPath}/clients/${siteClient.id}/client-secret`)
    if (!adminCredential?.value || !siteCredential?.value) throw new Error('A required client has no secret')
    const credentials = {
        adminApi: adminCredential.value,
        site: siteCredential.value,
    }
    return credentials
}
