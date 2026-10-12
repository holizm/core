import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import mapLocalizations from './mapLocalizations.js'

test('mapLocalizations merges panel locales and mounts part localization', () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'mapLocalizations'))
    const writeJson = (directory, value) => {
        fs.mkdirSync(directory, { recursive: true })
        fs.writeFileSync(path.join(directory, 'en.json'), JSON.stringify(value))
    }
    const volumes = []
    try {
        const composeFile = path.join(home, 'output', 'compose.yaml')
        writeJson(path.join(home, 'panel', 'localization'), { core: 'Core', shared: 'Core value' })
        writeJson(path.join(home, 'complexPanel', 'localization'), { shared: 'Panel value' })
        writeJson(path.join(home, 'blog', 'localization'), { blog: 'Blog' })
        fs.writeFileSync(path.join(home, 'blog', 'part'), '')
        mapLocalizations({
            addVolume: (source, target) => volumes.push({ source, target }),
            composeFile,
            containerHome: '/container',
            dependencies: ['blog'],
            home,
            repo: 'runnable',
        })
        assert.deepEqual(JSON.parse(fs.readFileSync(path.join(home, 'output', 'panelLocalization', 'en.json'))), {
            core: 'Core',
            shared: 'Panel value',
        })
        assert.deepEqual(volumes, [
            {
                source: path.join(home, 'output', 'panelLocalization'),
                target: '/container/panel/localization',
            },
            {
                source: path.join(home, 'blog', 'localization'),
                target: '/container/blog/localization',
            },
        ])
    }
    finally {
        fs.rmSync(home, { force: true, recursive: true })
    }
})
