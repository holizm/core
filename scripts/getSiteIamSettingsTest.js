import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import getSiteIamSettings from './getSiteIamSettings.js'

test('Site IAM settings contain only relevant credentials', () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'siteIamSettings'))
    const secretsDirectory = path.join(home, 'secrets')
    fs.mkdirSync(secretsDirectory)
    const base = {
        domain: 'example.com',
        secret: 'baseCredential',
    }
    const override = {
        domain: 'example.com',
        secret: 'themeCredential',
    }
    try {
        fs.writeFileSync(path.join(secretsDirectory, 'example.json'), JSON.stringify({
            production: { site: { iamClientSecrets: [base] } },
            ssh: { password: 'excludedCredential' },
        }))
        fs.writeFileSync(path.join(secretsDirectory, 'exampleThemes.json'), JSON.stringify({
            production: { site: { iamClientSecrets: [override] } },
            database: { password: 'excludedCredential' },
        }))
        const settings = getSiteIamSettings({
            home,
            repo: 'exampleThemes',
        })
        assert.deepEqual(settings, { iamClientSecrets: [override] })
    }
    finally {
        fs.rmSync(home, { force: true, recursive: true })
    }
})
