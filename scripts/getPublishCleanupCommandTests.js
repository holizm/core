import assert from 'assert/strict'
import test from 'node:test'
import getPublishCleanupCommand from './getPublishCleanupCommand.js'

test('getPublishCleanupCommand retains runtime files while removing published output', () => {
    const command = getPublishCleanupCommand('/deploy/adminPanel')
    assert.match(command, /^find \/deploy\/adminPanel -mindepth 1 -maxdepth 1 /)
    assert.match(command, /! -name '\.env'/)
    assert.match(command, /! -name 'node_modules'/)
    assert.match(command, /! -name 'tenants'/)
    assert.match(command, /-exec rm -rf \{\} \+$/)
    assert.doesNotMatch(command, /! -name 'dist'/)
})
