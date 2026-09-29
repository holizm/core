import assert from 'assert/strict'
import test from 'node:test'
import matchesContainer from './matchesContainer.js'

test('restarting a site preserves its API and other runnables', () => {
    const params = { containerName: 'holismControlSite' }
    assert.equal(matchesContainer('holismControlSite', params), true)
    assert.equal(matchesContainer('holismControlSiteApi', params), false)
    assert.equal(matchesContainer('holismSite', params), false)
})

test('explicit stop patterns retain case-insensitive group matching', () => {
    const params = { pattern: 'holismcontrol' }
    assert.equal(matchesContainer('holismControlSite', params), true)
    assert.equal(matchesContainer('holismControlSiteApi', params), true)
    assert.equal(matchesContainer('holismControlSite', params), false)
})

test('an empty stop selector matches all containers', () => {
    assert.equal(matchesContainer('holismControlSite', {}), true)
})
