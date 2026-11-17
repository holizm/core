import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import createSiteConfiguration from './createSiteConfiguration.js'

test('theme defaults remain declarative without changing undeclared system appearances', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'themeAppearance'))
    t.after(() => fs.rmSync(directory, {
        force: true,
        recursive: true,
    }))
    const repo = path.basename(directory)
    for (const [name, defaultAppearance] of [['theme01', 'dark'], ['theme02', 'light']]) {
        const theme = path.join(directory, name)
        fs.mkdirSync(theme)
        fs.writeFileSync(path.join(theme, 'theme.json'), JSON.stringify({ defaultAppearance }))
    }
    createSiteConfiguration({
        addVolume: () => {},
        containerHome: '/container',
        home: path.dirname(directory),
        multiThemed: true,
        process: 'site',
        repo,
        themeDirectories: ['theme01', 'theme02', 'theme03'],
    })
    const source = fs.readFileSync(path.join(directory, 'site', 'siteConfiguration.js'), 'utf8')
    const configuration = JSON.parse(source.replace(/^export default /, ''))
    assert.deepEqual(configuration.themeDefaultAppearances, {
        '01': 'dark',
        '02': 'light',
    })
    assert.equal(configuration.themeDefaultAppearances['03'], undefined)
})
