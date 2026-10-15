import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import pruneInactiveWebServerConfigs from './pruneInactiveWebServerConfigs.js'

test('pruneInactiveWebServerConfigs removes only inactive process configurations', t => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'webServerPrune'))
    t.after(() => fs.rmSync(base, { force: true, recursive: true }))
    const home = path.join(base, 'home')
    const root = path.join(base, 'output')
    fs.mkdirSync(path.join(home, 'shop', '.git'), { recursive: true })
    for (const [process, name] of [['activeApi', 'active'], ['oldApi', 'old']]) {
        const processPath = path.join(root, 'shop', process)
        fs.mkdirSync(path.join(processPath, 'webServer', 'conf.d'), { recursive: true })
        fs.mkdirSync(path.join(processPath, 'webServer', 'includes'))
        fs.writeFileSync(path.join(processPath, 'compose.yaml'), `container_name: ${name}\n`)
    }
    const removed = pruneInactiveWebServerConfigs({
        activeContainers: ['active'],
        home,
        root,
    })
    assert.equal(removed, 1)
    assert.equal(fs.existsSync(path.join(root, 'shop', 'activeApi', 'webServer', 'conf.d')), true)
    assert.equal(fs.existsSync(path.join(root, 'shop', 'oldApi', 'webServer', 'conf.d')), false)
    assert.equal(fs.existsSync(path.join(root, 'shop', 'oldApi', 'webServer', 'includes')), false)
})

test('inactive domains keep their certificates while active domains replace stale duplicates', t => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'webServerPruneDomains'))
    t.after(() => fs.rmSync(base, { force: true, recursive: true }))
    const home = path.join(base, 'home')
    const root = path.join(base, 'output')
    fs.mkdirSync(path.join(home, 'school', '.git'), { recursive: true })
    const definitions = [
        ['site', 'schoolSite', ['schoolos.local']],
        ['oldSite', 'oldSchoolSite', ['schoolos.local', 'retired.local']],
        ['gymSite', 'gymSite', ['gymos.local']],
    ]
    for (const [process, name, hosts] of definitions) {
        const processPath = path.join(root, 'school', process)
        fs.mkdirSync(path.join(processPath, 'webServer', 'conf.d'), { recursive: true })
        fs.mkdirSync(path.join(processPath, 'webServer', 'includes'))
        fs.writeFileSync(path.join(processPath, 'compose.yaml'), `container_name: ${name}\n`)
        for (const host of hosts) {
            fs.writeFileSync(path.join(processPath, 'webServer', 'conf.d', host + '.conf'), host)
            fs.writeFileSync(path.join(processPath, 'webServer', 'includes', host), host)
        }
    }
    const params = {
        activeContainers: ['gymSite'],
        home,
        root,
    }
    assert.equal(pruneInactiveWebServerConfigs(params), 0)
    const config = (process, host) => path.join(root, 'school', process, 'webServer', 'conf.d', host + '.conf')
    assert.equal(fs.existsSync(config('site', 'schoolos.local')), true)
    assert.equal(fs.existsSync(config('gymSite', 'gymos.local')), true)
    pruneInactiveWebServerConfigs({
        ...params,
        keepContainerName: 'schoolSite',
    })
    assert.equal(fs.existsSync(config('site', 'schoolos.local')), true)
    assert.equal(fs.existsSync(config('oldSite', 'schoolos.local')), false)
    assert.equal(fs.existsSync(config('oldSite', 'retired.local')), true)
    assert.equal(fs.existsSync(path.join(root, 'school', 'oldSite', 'webServer', 'includes', 'schoolos.local')), false)
})
