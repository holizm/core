import assert from 'assert/strict'
import test from 'node:test'
import mapSystemTenants from './mapSystemTenants.js'

test('mapSystemTenants mounts backing runnable tenants into a control process', () => {
    const volumes = []
    mapSystemTenants({
        addVolume: (...args) => volumes.push(args),
        containerHome: '/container',
        home: '/home/dev',
        process: 'api',
        repo: 'holismControl',
    })
    assert.deepEqual(volumes, [[
        '/home/dev/holism/common/tenants',
        '/container/holismControl/api/systemTenants',
    ]])
})
