import assert from 'assert/strict'
import test from 'node:test'
import pascalize from './pascalize.js'

test('pascalize handles representative cases', () => {
    assert.equal(pascalize('hello-world'), 'HelloWorld')
    assert.equal(pascalize(''), '')
})
