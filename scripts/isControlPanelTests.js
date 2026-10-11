import assert from 'assert/strict'
import test from 'node:test'
import isControlPanel from './isControlPanel.js'

test('isControlPanel identifies the panel process of a control runnable', () => {
    assert.equal(isControlPanel({ isControl: true, process: 'panel' }), true)
    assert.equal(isControlPanel({ isControl: true, process: 'api' }), false)
    assert.equal(Boolean(isControlPanel({ isControl: false, process: 'panel' })), false)
})
