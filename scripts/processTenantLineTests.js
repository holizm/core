import assert from 'assert/strict'
import test from 'node:test'
import processTenantLine from './processTenantLine.js'

test('processTenantLine resolves a local host from tenant data', () => {
    const params = processTenantLine({
        line: 'store example.com en,fa en admin',
        process: 'adminApi',
    })
    assert.equal(params.tenant, 'store')
    assert.equal(params.locales, 'en,fa')
    assert.equal(params.host, 'api.admin.example.local')
    assert.equal(params.process, 'adminApi')
})

test('processTenantLine accepts a host override', () => {
    const params = processTenantLine({
        getSpecificDomain: host => `custom.${host}`,
        line: 'store example.com en en',
        process: 'site',
    })
    assert.equal(params.host, 'custom.example.local')
})
