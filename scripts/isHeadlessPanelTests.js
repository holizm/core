import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import isHeadlessPanel from './isHeadlessPanel.js'

test('isHeadlessPanel requires both a panel process and headless marker', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'headlessPanel'))
    t.after(() => fs.rmSync(root, { force: true, recursive: true }))
    const panelPath = path.join(root, 'runnable', 'adminPanel')
    const apiPath = path.join(root, 'runnable', 'adminApi')
    fs.mkdirSync(panelPath, { recursive: true })
    fs.mkdirSync(apiPath)
    assert.equal(isHeadlessPanel({ processPath: panelPath }), false)
    fs.writeFileSync(path.join(panelPath, 'headless'), '')
    fs.writeFileSync(path.join(apiPath, 'headless'), '')
    assert.equal(isHeadlessPanel({ processPath: panelPath }), true)
    assert.equal(isHeadlessPanel({ processPath: apiPath }), false)
})
