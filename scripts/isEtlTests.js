import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import isEtl from './isEtl.js'

test('isEtl identifies an ETL API process', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'etlProcess'))
    t.after(() => fs.rmSync(home, { recursive: true, force: true }))
    const repoPath = path.join(home, 'shop')
    const etlPath = path.join(repoPath, 'etl')
    const apiPath = path.join(repoPath, 'adminApi')
    fs.mkdirSync(etlPath, { recursive: true })
    fs.mkdirSync(apiPath)
    assert.equal(isEtl({ processPath: etlPath }), true)
    assert.equal(isEtl({ processPath: apiPath }), false)
})
