import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import saveRealmSecrets from './saveRealmSecrets.js'

test('saveRealmSecrets replaces one domain secret and keeps other domains', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'realmSecrets'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    const file = path.join(directory, 'secrets.json')
    fs.writeFileSync(file, JSON.stringify({
        production: {
            admin: {
                iamClientSecrets: [
                    { domain: 'shop.example', secret: 'old' },
                    { domain: 'other.example', secret: 'keep' },
                ],
            },
        },
    }))
    saveRealmSecrets(file, 'shop.example', { admin: 'new' })
    const saved = JSON.parse(fs.readFileSync(file, 'utf8'))
    assert.deepEqual(saved.production.admin.iamClientSecrets, [
        { domain: 'other.example', secret: 'keep' },
        { domain: 'shop.example', secret: 'new' },
    ])
    assert.equal(fs.statSync(file).mode & 0o777, 0o600)
    const content = fs.readFileSync(file, 'utf8')
    saveRealmSecrets(file, 'shop.example', { admin: 'new' })
    assert.equal(fs.readFileSync(file, 'utf8'), content)
})
