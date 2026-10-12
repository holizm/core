import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import isRepo from './isRepo.js'

test('isRepo recognizes a repository marker inside a process path', t => {
    const processPath = fs.mkdtempSync(path.join(os.tmpdir(), 'repositoryMarker'))
    t.after(() => fs.rmSync(processPath, { force: true, recursive: true }))
    assert.equal(isRepo({ processPath }), false)
    fs.mkdirSync(path.join(processPath, '.git'))
    assert.equal(isRepo({ processPath }), true)
})
