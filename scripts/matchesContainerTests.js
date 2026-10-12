import assert from 'assert/strict'
import test from 'node:test'
import matchesContainer from './matchesContainer.js'

test('matchesContainer honors exact names before case-insensitive patterns', () => {
    assert.equal(matchesContainer('ordersApi', {}), true)
    assert.equal(matchesContainer('ordersApi', { pattern: 'ORDERS' }), true)
    assert.equal(matchesContainer('ordersApi', { pattern: 'panel' }), false)
    assert.equal(matchesContainer('ordersApi', {
        containerName: 'ordersApi',
        pattern: 'panel',
    }), true)
    assert.equal(matchesContainer('ordersApi', { containerName: 'ordersPanel' }), false)
})
