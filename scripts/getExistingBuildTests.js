import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import getExistingBuild from './getExistingBuild.js'

test('getExistingBuild combines paths and classifies a process', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'existingBuild'))
    t.after(() => fs.rmSync(home, { recursive: true, force: true }))
    const processPath = path.join(home, 'shop', 'adminApi')
    fs.mkdirSync(processPath, { recursive: true })
    const build = getExistingBuild({ home, process: 'adminApi', repo: 'shop' })
    assert.equal(build.processPath, processPath)
    assert.equal(build.isApi, true)
    assert.equal(build.isPanel, false)
    assert.equal(build.isSite, false)
})
