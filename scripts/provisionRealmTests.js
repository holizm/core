import assert from 'assert/strict'
import test from 'node:test'
import provision from './provisionRealm.js'
import { getRealmClients } from './realmConfiguration.js'
import mapper from './realmMapper.js'

test('realm provisioning assigns the required management audience only to the management client', async () => {
    for (const available of [true, false]) {
        const configuration = {
            domain: 'example.invalid',
            realm: 'business',
            roles: ['admin', 'user'],
        }
        const clients = getRealmClients(configuration).map(client => ({
            ...client,
            id: client.clientId,
        }))
        clients.push({
            clientId: 'realm-management',
            id: 'management',
        })
        const writes = []
        const request = async (method, path, body) => {
            if (method !== 'GET') {
                writes.push({
                    body,
                    method,
                    path,
                })
                return undefined
            }
            if (path === 'realms/business') {
                const result = { realm: 'business' }
                return result
            }
            if (path.endsWith('/client-scopes')) return available ? [{
                id: 'adminScope',
                name: 'kc-admin-api',
            }] : []
            if (path.includes('/clients?clientId=')) return clients.filter(client => client.clientId === path.split('clientId=')[1])
            if (path.endsWith('/protocol-mappers/models')) return [mapper]
            if (path.endsWith('/service-account-user')) {
                const result = { id: 'serviceUser' }
                return result
            }
            if (path.includes('/role-mappings/clients/')) return [{ id: 'administrator' }]
            if (path.endsWith('/roles/realm-admin')) {
                const result = { id: 'administrator' }
                return result
            }
            if (path.includes('/roles/')) {
                const result = { name: path.split('/').at(-1) }
                return result
            }
            if (path.endsWith('/client-secret')) {
                const result = { value: 'testCredential' }
                return result
            }
            throw new Error(`Unexpected request: ${path}`)
        }
        await provision(request, configuration)
        const assignments = writes.filter(write => write.path.includes('/default-client-scopes/'))
        assert.equal(assignments.length, available ? 1 : 0)
        if (available) assert.equal(assignments[0].path, 'realms/business/clients/adminApi/default-client-scopes/adminScope')
        assert.ok(!writes.some(write => write.path.includes('/role-mappings/')))
    }
})
