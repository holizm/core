import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import mapApiUtilities from './mapApiUtilities.js'

test('mapApiUtilities maps available tools for admin APIs only', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'apiUtilities'))
    t.after(() => fs.rmSync(home, { force: true, recursive: true }))
    fs.mkdirSync(path.join(home, 'etl'))
    fs.mkdirSync(path.join(home, 'sample', 'etl', 'orders'), { recursive: true })
    const volumes = []
    const params = {
        addVolume: (...args) => volumes.push(args),
        commonPath: path.join(home, 'sample', 'common'),
        containerHome: '/container',
        home,
        process: 'siteApi',
        repo: 'sample',
    }
    mapApiUtilities(params)
    assert.deepEqual(volumes, [])
    mapApiUtilities({ ...params, process: 'adminApi' })
    assert.ok(volumes.some(([source, target]) => source === path.join(home, 'etl') && target === '/container/etl'))
    assert.ok(volumes.some(([source, target]) => source.endsWith('/orders') && target.endsWith('/runnableImporters/orders')))
})
