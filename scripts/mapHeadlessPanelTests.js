import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import mapHeadlessPanel from './mapHeadlessPanel.js'

test('headless mappings use runnable-owned component directories', t => {
    const processPath = fs.mkdtempSync(path.join(os.tmpdir(), 'headlessMappings'))
    t.after(() => fs.rmSync(processPath, { force: true, recursive: true }))
    fs.mkdirSync(path.join(processPath, 'panel'))
    const volumes = []
    mapHeadlessPanel({
        addVolume: (...rest) => volumes.push(rest),
        containerHome: '/container',
        process: 'userPanel',
        processPath,
        repo: 'phoneAi',
    })
    assert.deepEqual(volumes, [[path.join(processPath, 'panel'), '/container/phoneAi/userPanel/src/panel']])
})
