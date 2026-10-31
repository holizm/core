import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import mapSiteThemes from './mapSiteThemes.js'

test('composition resolves core sources and retains a local theme with the same number', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'siteThemeComposition'))
    t.after(() => fs.rmSync(root, {
        force: true,
        recursive: true,
    }))
    const runnable = path.join(root, 'sampleThemes')
    const core = path.join(root, 'siteThemes', 'theme001')
    fs.mkdirSync(path.join(runnable, 'site'), { recursive: true })
    fs.mkdirSync(path.join(runnable, 'theme001'))
    fs.mkdirSync(core, { recursive: true })
    const volumes = []
    mapSiteThemes({
        addVolume: (...rest) => volumes.push(rest),
        containerHome: '/container',
        multiThemed: true,
        process: 'site',
        processPath: path.join(runnable, 'site'),
        repo: 'sampleThemes',
        themeDirectories: ['theme001', '../siteThemes/theme001'],
    })
    assert.deepEqual(volumes, [
        [path.join(runnable, 'theme001'), '/container/sampleThemes/site/src/themes/001'],
        [core, '/container/sampleThemes/site/src/themes/core001'],
    ])
})

test('single sites do not map theme directories', () => {
    mapSiteThemes({
        addVolume: () => assert.fail('Unexpected theme mount'),
        multiThemed: false,
    })
})
