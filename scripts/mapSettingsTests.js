import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import mapSettings from './mapSettings.js'

test('missing panel overrides are neither created nor mounted, including control panels', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'missingPanelOverride'))
    t.after(() => fs.rmSync(home, { force: true, recursive: true }))
    const settingsOverridePath = path.join(home, 'settingsOverride.json')
    const privateSettingsPath = path.join(home, 'privateSettings.json')
    for (const isControl of [false, true]) {
        fs.writeFileSync(privateSettingsPath, JSON.stringify({ isControl }))
        const volumes = []
        mapSettings({
            addVolume: (...rest) => volumes.push(rest),
            containerHome: '/home/dev',
            home,
            privateSettingsPath,
            process: 'userPanel',
            processType: 'panel',
            publicSettingsPath: path.join(home, 'publicSettings.json'),
            repo: 'phoneAi',
            settingsOverridePath,
        })
        assert.equal(fs.existsSync(settingsOverridePath), false)
        assert.equal(volumes.some(volume => volume.some(value => value.includes('settingsOverride.json'))), false)
    }
})

test('mapSettings mounts panel public settings in its public directory', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'mapSettings'))
    t.after(() => fs.rmSync(home, { force: true, recursive: true }))
    const publicSettingsPath = path.join(home, 'publicSettings.json')
    const settingsOverridePath = path.join(home, 'settingsOverride.json')
    fs.writeFileSync(publicSettingsPath, '{}')
    fs.writeFileSync(settingsOverridePath, '{}')
    fs.mkdirSync(path.join(home, 'secrets'))
    const publicCommonPath = path.join(home, 'secrets', 'publicCommon.json')
    fs.writeFileSync(publicCommonPath, '{"accounts":{"realm":"dev"}}')
    const volumes = []
    mapSettings({
        addVolume: (...args) => volumes.push(args),
        containerHome: '/home/dev',
        home,
        process: 'adminPanel',
        processType: 'panel',
        publicSettingsPath,
        repo: 'shop',
        settingsOverridePath,
    })
    assert.deepEqual(volumes, [
        ['/tmp/shop/adminPanel/settings/publicSettings.json', '/home/dev/shop/adminPanel/public/publicSettings.json'],
        [settingsOverridePath, '/home/dev/shop/adminPanel/public/settingsOverride.json'],
        [publicCommonPath, '/home/dev/shop/adminPanel/publicCommon.json:ro'],
    ])
    assert.deepEqual(JSON.parse(fs.readFileSync('/tmp/shop/adminPanel/settings/publicSettings.json', 'utf8')), {
        accounts: { realm: 'dev' },
    })
})
