import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import mapSettings from './mapSettings.js'
import { mapSecrets } from './startPanel.js'

test('Panel maps only browser-safe settings', () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'panelSettingsBoundary'))
    const secretsDirectory = path.join(home, 'secrets')
    fs.mkdirSync(secretsDirectory)
    fs.writeFileSync(path.join(secretsDirectory, 'publicCommon.json'), '{}')
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
        mapSecrets(params)
        assert.deepEqual(volumes, [{
            left: path.join(secretsDirectory, 'publicCommon.json'),
            right: '/container/example/adminPanel/public/publicCommon.json:ro',
        }])
        assert.equal(fs.statSync(secretsDirectory).mode & 0o777, 0o700)
        assert.equal(fs.statSync(volumes[0].left).mode & 0o777, 0o600)
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
            assert.ok(names.includes(`/container/example/${processType}/repo.json:ro`))
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
