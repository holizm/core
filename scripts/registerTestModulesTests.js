import assert from 'assert/strict'
import test from 'node:test'
import './registerTestModules.js'

test('test alias preserves default and named module exports', async () => {
    const aliased = await import('test')
    const native = await import('node:test')
    assert.equal(aliased.default, native.default)
    assert.equal(aliased.beforeEach, native.beforeEach)
})

test('panelTests exposes test helpers without loading production panel modules', async () => {
    const { verifyRecordView } = await import('panelTests')
    assert.equal(typeof verifyRecordView, 'function')
})
