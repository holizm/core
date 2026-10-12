import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import readDatabaseCompose from './readDatabaseCompose.js'

test('readDatabaseCompose reads the local database Compose result', async t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'databaseCompose'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    const docker = path.join(directory, 'docker')
    fs.writeFileSync(docker, '#!/bin/sh\nprintf \'%s\' \'{"services":{"database":{"image":"mongo"}}}\'\n', { mode: 0o700 })
    const previousPath = process.env.PATH
    process.env.PATH = `${directory}:${previousPath}`
    try {
        const result = await readDatabaseCompose({ composePath: path.join(directory, 'compose.yaml') })
        assert.equal(result.services.database.image, 'mongo')
    }
    finally {
        process.env.PATH = previousPath
    }
})

test('readDatabaseCompose rejects invalid remote instance names', async () => {
    await assert.rejects(readDatabaseCompose({
        domain: 'shop.example',
        home: '/tmp',
        instance: '../shop',
    }), /Unable to read database Compose configuration/)
})
