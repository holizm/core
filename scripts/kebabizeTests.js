import assert from 'assert/strict'
import test from 'node:test'
import kebabize from './kebabize.js'

test('kebabize handles representative cases', () => {
    assert.equal(kebabize('Hello World'), 'hello-world')
    assert.equal(kebabize('alreadyKebab'), 'already-kebab')
    assert.equal(kebabize(''), '')
})
