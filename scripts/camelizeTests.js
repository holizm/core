import assert from 'assert/strict'
import test from 'node:test'
import camelize from './camelize.js'

test('camelize converts separated and capitalized words to camel case', () => {
    assert.equal(camelize(''), '')
    assert.equal(camelize('Order Items'), 'orderItems')
    assert.equal(camelize('api_response-code'), 'apiResponseCode')
})
