import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import isProcess from './isProcess.js'

test('isProcess recognizes process names and marker files at process depth', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'processTest'))
    t.after(() => fs.rmSync(home, { recursive: true, force: true }))
    const repoPath = path.join(home, 'sample')
    const apiPath = path.join(repoPath, 'adminApi')
    const markerPath = path.join(repoPath, 'service')
    const unrelatedPath = path.join(repoPath, 'assets')
    fs.mkdirSync(apiPath, { recursive: true })
    fs.mkdirSync(markerPath)
    fs.mkdirSync(unrelatedPath)
    fs.writeFileSync(path.join(markerPath, 'Api'), '')
    assert.equal(isProcess({ processPath: apiPath }), true)
    assert.equal(isProcess({ processPath: markerPath }), true)
    assert.equal(isProcess({ processPath: unrelatedPath }), false)
    assert.equal(isProcess({ processPath: repoPath }), false)
})
