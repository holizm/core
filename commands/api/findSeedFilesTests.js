import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import findSeedFiles from './findSeedFiles.js'

test('seed discovery includes composed parts and excludes uncomposed repositories', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'seedDiscovery'))
    t.after(() => fs.rmSync(directory, {
        force: true,
        recursive: true,
    }))
    for (const name of ['selected', 'unselected']) {
        fs.mkdirSync(`${directory}/${name}/api/data/nested`, { recursive: true })
        fs.writeFileSync(`${directory}/${name}/part`, '')
        fs.writeFileSync(`${directory}/${name}/api/data/nested/items.json`, '[]')
    }
    fs.mkdirSync(`${directory}/process/node_modules`, { recursive: true })
    fs.symlinkSync(`${directory}/selected`, `${directory}/process/node_modules/selected`)
    assert.deepEqual(findSeedFiles(`${directory}/process`, directory), [
        `${directory}/selected/api/data/nested/items.json`,
    ])
})
