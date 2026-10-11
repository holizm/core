import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import isControlRunnable from './isControlRunnable.js'

test('isControlRunnable reads the explicit control flag', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'controlRunnable'))
    t.after(() => fs.rmSync(home, { recursive: true, force: true }))
    const privateSettingsPath = path.join(home, 'privateSettings.json')
    assert.equal(isControlRunnable({ privateSettingsPath }), false)
    fs.writeFileSync(privateSettingsPath, JSON.stringify({ isControl: false }))
    assert.equal(isControlRunnable({ privateSettingsPath }), false)
    fs.writeFileSync(privateSettingsPath, JSON.stringify({ isControl: true }))
    assert.equal(isControlRunnable({ privateSettingsPath }), true)
})
