import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import mapNewSiteNode from './mapNewSiteNode.js'

test('mapNewSiteNode uses the new site runtime for a process without custom packages', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mapNewSiteNode'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    const volumes = []
    const params = {
        addVolume: (...args) => volumes.push(args),
        containerHome: '/home/dev',
        home: directory,
        process: 'site',
        processType: 'site',
        repo: 'shop',
        sitePackageJson: path.join(directory, 'missing.json'),
    }
    mapNewSiteNode(params)
    assert.ok(volumes.some(([source, target]) => source === `${directory}/newSite/package.json` && target.endsWith('/corePackage.json')))
    assert.ok(volumes.some(([source, target]) => source === '/var/tmp/newSite/nodeModules' && target === '/home/dev/shop/site/node_modules'))
})

test('mapNewSiteNode mounts custom API dependencies at the root and process', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mapNewSiteNode'))
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
    mapNewSiteNode(params)
    assert.equal(fs.readFileSync(lock, 'utf8'), '{}')
    assert.ok(volumes.some(([source, target]) => source === '/var/tmp/shop/api/nodeModules' && target === '/home/dev/node_modules'))
})
