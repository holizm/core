import assert from 'assert/strict'
import test from 'node:test'
import getProcessComposeSettings from './getProcessComposeSettings.js'

test('read-only mounts preserve paths and prevent Docker from creating missing host paths', () => {
    const settings = getProcessComposeSettings({
        isBuild: false,
        port: 42000,
        runtime: {
            internal: true,
            readOnlyDirectories: ['/logs/with "quotes"'],
        },
    })
    assert.match(settings.apiPortBindings, /127\.0\.0\.1:42000:5000/)
    assert.ok(settings.apiReadOnlyMounts.includes(JSON.stringify('/logs/with "quotes"')))
    assert.match(settings.apiReadOnlyMounts, /read_only: true/)
    assert.match(settings.apiReadOnlyMounts, /create_host_path: false/)
})

test('builds never mount host logs and existing processes preserve loopback publication', () => {
    const settings = getProcessComposeSettings({
        isBuild: true,
        port: 42000,
        runtime: {
            internal: false,
            readOnlyDirectories: ['/logs'],
        },
    })
    assert.equal(settings.apiReadOnlyMounts, '')
    assert.equal(settings.processIsBuild, true)
    assert.match(settings.apiPortBindings, /127\.0\.0\.1:42000:5000/)
})
