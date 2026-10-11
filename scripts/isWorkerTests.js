import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import isWorker from './isWorker.js'

test('isWorker recognizes worker process directories', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'workerProcessTest'))
    t.after(() => fs.rmSync(home, { recursive: true, force: true }))
    const repoPath = path.join(home, 'sample')
    const workerPath = path.join(repoPath, 'worker')
    const sitePath = path.join(repoPath, 'site')
    fs.mkdirSync(workerPath, { recursive: true })
    fs.mkdirSync(sitePath)
    assert.equal(isWorker({ processPath: workerPath }), true)
    assert.equal(isWorker({ processPath: sitePath }), false)
})
