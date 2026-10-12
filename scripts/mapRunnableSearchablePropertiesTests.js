import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import mapRunnableSearchableProperties from './mapRunnableSearchableProperties.js'

test('mapRunnableSearchableProperties mounts a declared search configuration', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'searchableProperties'))
    t.after(() => fs.rmSync(root, { force: true, recursive: true }))
    const file = path.join(root, 'runnableSearchableProperties.json')
    const volumes = []
    const params = {
        addVolume: (...args) => volumes.push(args),
        commonPath: root,
        containerHome: '/container',
        process: 'adminApi',
        repo: 'shop',
        runnableSearchablePropertiesPath: file,
    }
    mapRunnableSearchableProperties(params)
    assert.deepEqual(volumes, [])
    fs.writeFileSync(file, '{}')
    mapRunnableSearchableProperties(params)
    assert.deepEqual(volumes, [[file, '/container/shop/adminApi/runnableSearchableProperties.json']])
})
