import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import getPaths from './getPaths.js'

test('getPaths resolves ordinary and themed runnable locations', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'getPaths'))
    t.after(() => fs.rmSync(home, { recursive: true, force: true }))
    const ordinary = getPaths({ home, process: 'adminPanel', repo: 'shop' })
    assert.equal(ordinary.repoPath, path.join(home, 'shop'))
    assert.equal(ordinary.processPath, path.join(home, 'shop', 'adminPanel'))
    assert.equal(ordinary.tenantsPath, path.join(home, 'shop', 'common', 'tenants'))
    const themed = getPaths({ home, process: 'site', repo: 'shopThemes' })
    assert.equal(themed.dependenciesPath, path.join(home, 'shop', 'common', 'dependencies'))
    assert.equal(themed.tenantsPath, path.join(home, 'shop', 'common', 'tenants'))
})
