import assert from 'assert/strict'
import test from 'node:test'
import getDeterministicPort from './getDeterministicPort.js'

test('getDeterministicPort is stable and stays in the local ephemeral range', () => {
    const first = getDeterministicPort('sampleAdminApi')
    assert.equal(getDeterministicPort('sampleAdminApi'), first)
    assert.ok(Number.isInteger(first))
    assert.ok(first >= 1024 && first <= 65535)
})
