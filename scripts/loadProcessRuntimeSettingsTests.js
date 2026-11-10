import assert from 'assert/strict'
import {
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import test from 'node:test'
import loadProcessRuntimeSettings from './loadProcessRuntimeSettings.js'

test('reads the process settings declaration while missing declarations preserve existing behavior', t => {
    const processPath = mkdtempSync(path.join(tmpdir(), 'runtimeSettings'))
    t.after(() => rmSync(processPath, {
        force: true,
        recursive: true,
    }))
    assert.equal(loadProcessRuntimeSettings({ processPath }).internal, false)
    writeFileSync(path.join(processPath, 'settingsOverride.json'), JSON.stringify({ runtime: { internal: true } }))
    assert.equal(loadProcessRuntimeSettings({ processPath }).internal, true)
    assert.equal(loadProcessRuntimeSettings({}).internal, false)
})
