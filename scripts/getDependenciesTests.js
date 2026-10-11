import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import getDependencies from './getDependencies.js'

test('getDependencies combines essential, declared and runnable parts', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'getDependencies'))
    t.after(() => fs.rmSync(home, { recursive: true, force: true }))
    const repoPath = path.join(home, 'shop')
    const commonPath = path.join(repoPath, 'common')
    const localPart = path.join(repoPath, 'orders')
    fs.mkdirSync(commonPath, { recursive: true })
    fs.mkdirSync(localPart)
    fs.writeFileSync(path.join(localPart, 'part'), 'orders')
    const dependenciesPath = path.join(commonPath, 'dependencies')
    const essentialPartsPath = path.join(home, 'essentialParts')
    fs.writeFileSync(dependenciesPath, 'blog\n')
    fs.writeFileSync(essentialPartsPath, 'globalization\n')
    assert.deepEqual(getDependencies({
        dependenciesPath,
        essentialPartsPath,
        home,
        process: 'adminApi',
        repo: 'shop',
    }), ['blog', 'globalization', 'orders'])
})
