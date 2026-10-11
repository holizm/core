import assert from 'assert/strict'
import test from 'node:test'
import getLocalHost from './getLocalHost.js'

test('getLocalHost derives local API and site hosts from process names', () => {
    assert.equal(getLocalHost({ domain: 'example.com', process: 'adminApi' }), 'api.admin.example.local')
    assert.equal(getLocalHost({ domain: 'example.com', process: 'site' }), 'example.local')
    assert.equal(getLocalHost({ domain: 'example.com', process: 'api', repo: 'exampleControl' }), 'api.control.example.local')
})
