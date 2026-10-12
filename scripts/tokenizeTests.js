import assert from 'assert/strict'
import test from 'node:test'
import tokenize from './tokenize.js'

test('tokenize separates camel case, punctuation, and underscores', () => {
    assert.deepEqual(tokenize(''), [])
    assert.deepEqual(tokenize('orderItem_value'), ['order', 'Item', 'value'])
    assert.deepEqual(tokenize('one-two three'), ['one', 'two', 'three'])
})
