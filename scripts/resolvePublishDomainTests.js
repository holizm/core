import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import resolvePublishDomain from './resolvePublishDomain.js'

test('resolvePublishDomain selects the deployment for the requested repository', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'publishDomain'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    const secrets = path.join(directory, 'secrets')
    fs.mkdirSync(secrets)
    fs.writeFileSync(path.join(secrets, 'broken.json'), '{')
    fs.writeFileSync(path.join(secrets, 'other.json'), JSON.stringify({
        deployment: {
            instances: [{ domain: 'other.example' }],
            vcsRepo: 'other',
        },
    }))
    fs.writeFileSync(path.join(secrets, 'shop.json'), JSON.stringify({
        deployment: {
            instances: [{ domain: 'shop.example' }],
            vcsRepo: 'shop',
        },
    }))
    const previousHome = process.env.HOME
    process.env.HOME = directory
    try {
        assert.equal(resolvePublishDomain('shop'), 'shop.example')
    }
    finally {
        process.env.HOME = previousHome
    }
})
