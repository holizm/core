import assert from 'assert/strict'
import test from 'node:test'
import camelize from './camelize.js'

test('camelize handles representative cases', () => {
    assert.equal(camelize('hello-world'), 'helloWorld')
    assert.equal(camelize('Hello World'), 'helloWorld')
    assert.equal(camelize(''), '')
})
