import assert from 'assert/strict'
import test from 'node:test'
import isDir from './isDir.js'

test('isDir distinguishes a directory from a file and missing path', () => {
    assert.equal(isDir(new URL('.', import.meta.url).pathname), true)
    assert.equal(isDir(new URL('./isDir.js', import.meta.url).pathname), false)
    assert.equal(isDir('/tmp/nonexistentCoreTestDirectory'), false)
})
