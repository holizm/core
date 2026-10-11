import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import isAccounts from './isAccounts.js'

test('isAccounts recognizes the accounts process only', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'accountsProcess'))
    t.after(() => fs.rmSync(home, { recursive: true, force: true }))
    const repoPath = path.join(home, 'shop')
    const accountsPath = path.join(repoPath, 'accounts')
    const apiPath = path.join(repoPath, 'adminApi')
    fs.mkdirSync(accountsPath, { recursive: true })
    fs.mkdirSync(apiPath)
    assert.equal(isAccounts({ processPath: accountsPath }), true)
    assert.equal(isAccounts({ processPath: apiPath }), false)
})
