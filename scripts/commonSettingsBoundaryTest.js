import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import mapSettings from './mapSettings.js'

test('Panel maps only browser-safe settings', () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'panelSettingsBoundary'))
    const secretsDirectory = path.join(home, 'secrets')
    const volumes = []
    const params = {
        addVolume: (left, right) => volumes.push({ left, right }),
        connectionStringsPath: path.join(home, 'connectionStrings.json'),
        containerHome: '/container',
        home,
        privateSettingsPath: path.join(home, 'privateSettings.json'),
        process: 'adminPanel',
        processType: 'panel',
        publicSettingsPath: path.join(home, 'publicSettings.json'),
        repo: 'example',
        settingsOverridePath: path.join(home, 'settingsOverride.json'),
    }
    try {
        mapSettings(params)
        assert.deepEqual(volumes, [])
        assert.equal(fs.existsSync(secretsDirectory), false)
    }
    finally {
        fs.rmSync(home, { force: true, recursive: true })
    }
})

test('API and site receive common settings outside public', () => {
    for (const processType of ['api', 'site']) {
        const home = fs.mkdtempSync(path.join(os.tmpdir(), 'serverSettingsBoundary'))
        const volumes = []
        const params = {
            addVolume: (left, right) => volumes.push({ left, right }),
            containerHome: '/container',
            home,
            process: processType,
            processType,
            repo: 'example',
        }
        try {
            mapSettings(params)
            const names = volumes.map(volume => volume.right)
            assert.ok(names.includes(`/container/example/${processType}/privateCommon.json:ro`))
            assert.ok(names.includes(`/container/example/${processType}/publicCommon.json:ro`))
            if (processType === 'api') {
                assert.ok(names.includes('/container/example/api/repo.json:ro'))
            }
            else {
                assert.ok(names.includes('/container/example/site/siteIamSettings.json:ro'))
                assert.ok(names.every(name => !name.includes('/repo.json')))
            }
            assert.ok(names.every(name => !name.includes('/public/privateCommon.json')))
            assert.ok(names.every(name => !name.includes('/public/repo.json')))
        }
        finally {
            fs.rmSync(home, { force: true, recursive: true })
        }
    }
})

test('Compose templates do not map credentials into public', () => {
    const directory = path.join(import.meta.dirname, '..', 'container', 'composes')
    for (const name of fs.readdirSync(directory)) {
        const source = fs.readFileSync(path.join(directory, name), 'utf8')
        assert.doesNotMatch(source, /\/public\/(?:common|privateCommon|repo|secrets)\.json/)
    }
})
