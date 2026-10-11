import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import getSiteIamSettings from './getSiteIamSettings.js'

test('getSiteIamSettings merges backing and theme credentials by domain and realm', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'siteIamSettings'))
    t.after(() => fs.rmSync(home, { recursive: true, force: true }))
    const secrets = path.join(home, 'secrets')
    fs.mkdirSync(secrets)
    fs.writeFileSync(path.join(secrets, 'shop.json'), JSON.stringify({
        production: { site: { iamClientSecrets: [{ domain: 'shop.example', realm: 'main', secret: 'base' }] } },
    }))
    fs.writeFileSync(path.join(secrets, 'shopThemes.json'), JSON.stringify({
        production: { site: { iamClientSecrets: [{ domain: 'shop.example', realm: 'main', secret: 'theme' }] } },
    }))
    assert.deepEqual(getSiteIamSettings({ home, repo: 'shopThemes' }), {
        iamClientSecrets: [{ domain: 'shop.example', realm: 'main', secret: 'theme' }],
    })
})
