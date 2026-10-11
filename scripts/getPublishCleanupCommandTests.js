import assert from 'assert/strict'
import test from 'node:test'
import getPublishCleanupCommand from './getPublishCleanupCommand.js'

test('getPublishCleanupCommand handles representative cases', () => {
    const command = getPublishCleanupCommand('/tmp/publishedProcess')
    assert.match(command, /^find \/tmp\/publishedProcess -mindepth 1 -maxdepth 1 /)
    assert.match(command, /! -name 'secrets.json'/)
    assert.match(command, /! -name 'site'/)
    assert.match(command, /-exec rm -rf \{\} \+$/)
})
