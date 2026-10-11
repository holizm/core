import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import isSite from './isSite.js'

test('isSite recognizes site names and page directories', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'siteProcessTest'))
    t.after(() => fs.rmSync(home, { recursive: true, force: true }))
    const repoPath = path.join(home, 'sample')
    const sitePath = path.join(repoPath, 'site')
    const apiPath = path.join(repoPath, 'adminApi')
    fs.mkdirSync(sitePath, { recursive: true })
    fs.mkdirSync(apiPath)
    assert.equal(isSite({ processPath: sitePath }), true)
    assert.equal(isSite({ processPath: apiPath }), false)
    fs.mkdirSync(path.join(apiPath, 'pages'))
    assert.equal(isSite({ processPath: apiPath }), true)
})
