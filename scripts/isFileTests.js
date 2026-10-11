import assert from 'assert/strict'
import test from 'node:test'
import isFile from './isFile.js'

test('isFile distinguishes a file from a directory and missing path', () => {
    assert.equal(isFile(new URL('./isFile.js', import.meta.url).pathname), true)
    assert.equal(isFile(new URL('.', import.meta.url).pathname), false)
    assert.equal(isFile('/tmp/nonexistentCoreTestFile'), false)
})
