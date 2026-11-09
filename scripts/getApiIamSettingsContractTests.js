import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import getApiIamSettings from './getApiIamSettings.js'

test('Control APIs receive only admin IAM credentials, with explicit realm overrides', () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'apiIamSettingsTest'))
    const secretsDirectory = path.join(home, 'secrets')
    fs.mkdirSync(secretsDirectory)
    const shared = {
        domain: 'example.com',
        secret: 'sharedCredential',
    }
    const override = {
        domain: 'example.com',
        realm: 'targetRealm',
        secret: 'targetCredential',
    }
    try {
        fs.writeFileSync(path.join(secretsDirectory, 'privateCommon.json'), JSON.stringify({
            iam: { '192.0.2.1': 'automationCredential' },
            unrelatedCredential: 'excludedCredential',
        }))
        fs.writeFileSync(path.join(secretsDirectory, 'example.json'), JSON.stringify({
            production: {
                adminApi: { iamClientSecrets: [shared] },
                database: { password: 'excludedCredential' },
            },
        }))
        fs.writeFileSync(path.join(secretsDirectory, 'exampleControl.json'), JSON.stringify({
            production: { adminApi: { iamClientSecrets: [override] } },
        }))
        const settings = getApiIamSettings({
            home,
            repo: 'exampleControl',
        })
        assert.deepEqual(settings, {
            iam: { '192.0.2.1': 'automationCredential' },
            production: { adminApi: { iamClientSecrets: [shared, override] } },
        })
        assert.deepEqual(getApiIamSettings({
            home,
            repo: 'unknown',
        }).production.adminApi.iamClientSecrets, [])
    }
    finally {
        fs.rmSync(home, {
            force: true,
            recursive: true,
        })
    }
})
