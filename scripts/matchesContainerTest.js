import assert from 'assert/strict'
import test from 'node:test'
import matchesContainer from './matchesContainer.js'

test('restarting a site preserves its API and other runnables', () => {
    const params = { containerName: 'jzpControlSite' }
    assert.equal(matchesContainer('jzpControlSite', params), true)
    assert.equal(matchesContainer('jzpControlSiteApi', params), false)
    assert.equal(matchesContainer('jzpSite', params), false)
})

test('explicit stop patterns retain case-insensitive group matching', () => {
    const params = { pattern: 'jzpcontrol' }
    assert.equal(matchesContainer('jzpControlSite', params), true)
    assert.equal(matchesContainer('jzpControlSiteApi', params), true)
    assert.equal(matchesContainer('holismControlSite', params), false)
})

test('an empty stop selector matches all containers', () => {
    assert.equal(matchesContainer('jzpControlSite', {}), true)
})
