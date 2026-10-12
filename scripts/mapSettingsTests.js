import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import mapSettings from './mapSettings.js'

test('mapSettings mounts panel public settings in its public directory', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'mapSettings'))
    t.after(() => fs.rmSync(home, { force: true, recursive: true }))
    const publicSettingsPath = path.join(home, 'publicSettings.json')
    const settingsOverridePath = path.join(home, 'settingsOverride.json')
    fs.writeFileSync(publicSettingsPath, '{}')
    fs.writeFileSync(settingsOverridePath, '{}')
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
        [publicSettingsPath, '/home/dev/shop/adminPanel/public/publicSettings.json'],
        [settingsOverridePath, '/home/dev/shop/adminPanel/public/settingsOverride.json'],
    ])
})
