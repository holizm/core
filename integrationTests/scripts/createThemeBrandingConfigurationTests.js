import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import createSiteConfiguration from '../../scripts/createSiteConfiguration.js'

test('theme branding configuration retains runtime media and keeps themes separate', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'themeBrandingConfiguration'))
    t.after(() => fs.rmSync(directory, {
        force: true,
        recursive: true,
    }))
    const repo = path.basename(directory)
    const home = path.join(directory, 'sources')
    const data = path.join(home, repo, 'theme01', 'data')
    const branding = {
        brand: 'Original brand',
        documentTitle: 'Original title',
        icons: [{
            href: 'https://media.example/icon.ico',
            rel: 'icon',
        }],
        logo: 'https://media.example/logo.svg',
        slogan: 'Original slogan',
    }
    fs.mkdirSync(data, { recursive: true })
    fs.writeFileSync(path.join(data, 'branding.json'), JSON.stringify(branding))
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
    assert.deepEqual(configuration.themeBranding, { '01': branding })
    assert.equal(configuration.themeTitles['01'], branding.documentTitle)
})
