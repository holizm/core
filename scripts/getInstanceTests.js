import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import getInstance from './getInstance.js'

test('getInstance selects the matching domain and repository', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'getInstance'))
    const previousHome = process.env.HOME
    t.after(() => {
        process.env.HOME = previousHome
        fs.rmSync(home, { recursive: true, force: true })
    })
    process.env.HOME = home
    const secrets = path.join(home, 'secrets')
    fs.mkdirSync(secrets)
    fs.writeFileSync(path.join(secrets, 'shop.json'), JSON.stringify({
        deployment: {
            instances: [
                { domain: 'shop.example', name: 'shopProd' },
                { domain: 'staging.example', name: 'shopStaging' },
            ],
            vcsRepo: 'shop',
        },
    }))
    assert.deepEqual(getInstance('shop.example', 'shop'), { domain: 'shop.example', name: 'shopProd' })
})
