import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import mapNode from './mapNode.js'

test('mapNode mounts shared runtime dependencies for a panel without custom packages', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mapNode'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    const volumes = []
    const params = {
        addVolume: (...args) => volumes.push(args),
        containerHome: '/home/dev',
        home: directory,
        panelPackageJson: path.join(directory, 'missing.json'),
        process: 'adminPanel',
        processType: 'panel',
        repo: 'shop',
    }
    mapNode(params)
    assert.equal(params.nodeModules, '/home/dev/shop/adminPanel/node_modules')
    assert.ok(volumes.some(([source, target]) => source === `${directory}/panel/lock.json` && target.endsWith('/package-lock.json')))
    assert.ok(volumes.some(([source]) => source === '/var/tmp/panel/nodeModules'))
})

test('mapNode mounts custom API packages and creates its lock file', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mapNode'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    const packageJson = path.join(directory, 'api.json')
    const lock = path.join(directory, 'apiLock.json')
    fs.writeFileSync(packageJson, '{}')
    const volumes = []
    const params = {
        addVolume: (...args) => volumes.push(args),
        apiLock: lock,
        apiPackageJson: packageJson,
        containerHome: '/home/dev',
        home: directory,
        process: 'adminApi',
        processType: 'api',
        repo: 'shop',
    }
    mapNode(params)
    assert.equal(fs.readFileSync(lock, 'utf8'), '{}')
    assert.ok(volumes.some(([source, target]) => source === '/var/tmp/shop/api/nodeModules' && target === '/home/dev/node_modules'))
    assert.ok(volumes.some(([source, target]) => source === packageJson && target.endsWith('/api.json')))
})
