import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import createSiteConfiguration from '../../scripts/createSiteConfiguration.js'

test('theme preview titles are composed from existing branding declarations', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'themeTitleConfiguration'))
    t.after(() => fs.rmSync(directory, {
        force: true,
        recursive: true,
    }))
    const repo = path.basename(directory)
    const home = path.join(directory, 'sources')
    const data = path.join(home, repo, 'theme01', 'data')
    fs.mkdirSync(data, { recursive: true })
    fs.writeFileSync(path.join(data, 'branding.json'), JSON.stringify({ documentTitle: 'Original title' }))
    createSiteConfiguration({
        addVolume: () => {},
        containerHome: '/container',
        home,
        multiThemed: true,
        process: 'site',
        repo,
        themeDirectories: ['theme01', 'theme02'],
    })
    const source = fs.readFileSync(path.join(directory, 'site', 'siteConfiguration.js'), 'utf8')
    const configuration = JSON.parse(source.replace(/^export default /, ''))
    assert.deepEqual(configuration.themeTitles, { '01': 'Original title' })
    assert.deepEqual(configuration.themeNumbers, ['01', '02'])
})
