import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import isApi from './isApi.js'

test('isApi recognizes API processes and explicit process markers', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'apiProcessTest'))
    t.after(() => fs.rmSync(home, { recursive: true, force: true }))
    const repoPath = path.join(home, 'sample')
    const apiPath = path.join(repoPath, 'adminApi')
    const panelPath = path.join(repoPath, 'adminPanel')
    fs.mkdirSync(apiPath, { recursive: true })
    fs.mkdirSync(panelPath)
    assert.equal(isApi({ processPath: apiPath }), true)
    assert.equal(isApi({ processPath: panelPath }), false)
    fs.writeFileSync(path.join(panelPath, 'process.js'), '')
    assert.equal(isApi({ processPath: panelPath }), true)
})
