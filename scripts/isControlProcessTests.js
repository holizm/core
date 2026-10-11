import assert from 'assert/strict'
import test from 'node:test'
import isControlProcess from './isControlProcess.js'

test('isControlProcess recognizes control API and panel directories', () => {
    assert.equal(isControlProcess({ repo: 'holismControl', process: 'api' }), true)
    assert.equal(isControlProcess({ repo: 'holismControl', process: 'panel' }), true)
    assert.equal(isControlProcess({ repo: 'holismControl', process: 'site' }), false)
    assert.equal(isControlProcess({ repo: 'holism', process: 'api' }), false)
})
