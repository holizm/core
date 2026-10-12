import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import ensureTenants from './ensureTenants.js'

test('ensureTenants derives a control tenant from its backing runnable', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'controlTenants'))
    t.after(() => fs.rmSync(home, { force: true, recursive: true }))
    const backing = path.join(home, 'shop', 'common')
    fs.mkdirSync(backing, { recursive: true })
    fs.writeFileSync(path.join(backing, 'tenants'), 'store store.example.com en en\n')
    const privateSettingsPath = path.join(home, 'privateSettings.json')
    const tenantsPath = path.join(home, 'controlTenants')
    fs.writeFileSync(privateSettingsPath, JSON.stringify({ controlTenant: 'store' }))
    ensureTenants({
        home,
        isControl: true,
        isControlProcess: true,
        privateSettingsPath,
        repo: 'shopControl',
        tenantsPath,
    })
    assert.equal(fs.readFileSync(tenantsPath, 'utf8'), 'store store.example.com en en control\n')
})

test('ensureTenants preserves an existing tenant declaration', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'runnableTenants'))
    t.after(() => fs.rmSync(home, { force: true, recursive: true }))
    const tenantsPath = path.join(home, 'tenants')
    fs.writeFileSync(tenantsPath, 'store store.example.com en en\n')
    ensureTenants({ home, repo: 'shop', tenantsPath })
    assert.equal(fs.readFileSync(tenantsPath, 'utf8'), 'store store.example.com en en\n')
})
