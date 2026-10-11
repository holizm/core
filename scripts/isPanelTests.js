import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import isPanel from './isPanel.js'

test('isPanel accepts named and control panel processes', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'panelProcessTest'))
    t.after(() => fs.rmSync(home, { recursive: true, force: true }))
    const repoPath = path.join(home, 'sample')
    const panelPath = path.join(repoPath, 'adminPanel')
    const apiPath = path.join(repoPath, 'adminApi')
    fs.mkdirSync(panelPath, { recursive: true })
    fs.mkdirSync(apiPath)
    assert.equal(isPanel({ processPath: panelPath }), true)
    assert.equal(isPanel({ processPath: apiPath }), false)
    const controlPath = path.join(repoPath, 'panel')
    fs.mkdirSync(controlPath)
    assert.equal(isPanel({ isControl: true, process: 'panel', processPath: controlPath }), true)
})
