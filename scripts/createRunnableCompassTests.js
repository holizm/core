import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import createRunnableCompass from './createRunnableCompass.js'

test('createRunnableCompass writes one local Compass connection', async t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'runnableCompass'))
    const repo = path.basename(home)
    const outputDirectory = path.join(os.tmpdir(), repo, 'databases')
    t.after(() => {
        fs.rmSync(home, { force: true, recursive: true })
        fs.rmSync(path.dirname(outputDirectory), { force: true, recursive: true })
    })
    fs.mkdirSync(path.join(home, 'secrets'))
    fs.writeFileSync(path.join(home, 'secrets', `${repo}.json`), '{}')
    fs.mkdirSync(outputDirectory, { recursive: true })
    const docker = path.join(home, 'docker')
    const compose = JSON.stringify({
        services: {
            database: {
                environment: {
                    MONGO_INITDB_ROOT_PASSWORD: 'pass123',
                    MONGO_INITDB_ROOT_USERNAME: 'user123',
                },
                ports: [{ published: 27018, target: 27017 }],
            },
        },
    })
    fs.writeFileSync(docker, `#!/bin/sh\nprintf '%s' '${compose}'\n`, { mode: 0o700 })
    const previousPath = process.env.PATH
    process.env.PATH = `${home}:${previousPath}`
    try {
        assert.equal(await createRunnableCompass({ home, repo }), true)
        const saved = JSON.parse(fs.readFileSync(path.join(outputDirectory, 'compass.json'), 'utf8'))
        assert.equal(saved.connections.length, 1)
        assert.equal(saved.connections[0].favorite.name, `${repo}.local`)
        assert.equal(await createRunnableCompass({ home, repo }), false)
    }
    finally {
        process.env.PATH = previousPath
    }
})
