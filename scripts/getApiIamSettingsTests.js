import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import getApiIamSettings from './getApiIamSettings.js'

test('getApiIamSettings merges control credentials and shared IAM settings', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'apiIamSettings'))
    t.after(() => fs.rmSync(home, { recursive: true, force: true }))
    const secrets = path.join(home, 'secrets')
    fs.mkdirSync(secrets)
    fs.writeFileSync(path.join(secrets, 'shop.json'), JSON.stringify({
        production: { adminApi: { iamClientSecrets: [{ domain: 'shop.example', secret: 'base' }] } },
    }))
    fs.writeFileSync(path.join(secrets, 'shopControl.json'), JSON.stringify({
        production: { adminApi: { iamClientSecrets: [{ domain: 'shop.example', secret: 'control' }] } },
    }))
    fs.writeFileSync(path.join(secrets, 'privateCommon.json'), JSON.stringify({ iam: { origin: 'https://iam.example' } }))
    const settings = getApiIamSettings({ home, repo: 'shopControl' })
    assert.deepEqual(settings.iam, { origin: 'https://iam.example' })
    assert.deepEqual(settings.production.adminApi.iamClientSecrets, [{ domain: 'shop.example', secret: 'control' }])
})
