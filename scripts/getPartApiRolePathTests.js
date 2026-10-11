import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import getPartApiRolePath from './getPartApiRolePath.js'

test('getPartApiRolePath selects an existing role and validates a role link', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'partApiRole'))
    t.after(() => fs.rmSync(home, { recursive: true, force: true }))
    const dependencyBase = path.join(home, 'blog')
    const rolePath = path.join(dependencyBase, 'api', 'admin')
    const processPath = path.join(home, 'adminApi')
    fs.mkdirSync(rolePath, { recursive: true })
    fs.mkdirSync(processPath)
    const params = { dependency: 'blog', dependencyBase, processPath }
    assert.equal(getPartApiRolePath(params), rolePath)
    fs.symlinkSync(rolePath, path.join(processPath, 'blog'))
    assert.equal(getPartApiRolePath(params), rolePath)
    fs.rmSync(path.join(processPath, 'blog'))
    fs.symlinkSync(home, path.join(processPath, 'blog'))
    assert.throws(() => getPartApiRolePath(params), /Invalid API role selection/)
})
