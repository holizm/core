import assert from 'assert/strict'
import test from 'node:test'
import getProcessRole from './getProcessRole.js'

test('getProcessRole handles representative cases', () => {
    assert.equal(getProcessRole('adminApi'), 'admin')
    assert.equal(getProcessRole('api', true), 'admin')
    assert.equal(getProcessRole('managerPanel'), 'manager')
    assert.equal(getProcessRole('publicSite'), 'site')
    assert.equal(getProcessRole('unknown'), null)
})
