import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import createSiteConfiguration from './createSiteConfiguration.js'

test('theme preview titles reuse the owning home content', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'themePreviewTitle'))
    t.after(() => fs.rmSync(directory, {
        force: true,
        recursive: true,
    }))
    const repo = path.basename(directory)
    const content = path.join(directory, 'theme01', 'data')
    fs.mkdirSync(content, { recursive: true })
    fs.writeFileSync(path.join(content, 'home.json'), JSON.stringify({ seo: { title: 'Travel' } }))
    fs.writeFileSync(path.join(content, 'originalHome.json'), JSON.stringify({ metadata: {
        description: 'Reference description',
        title: 'Reference title',
        url: 'https://original.example/',
    } }))
    const reference = path.join(directory, 'theme02', 'data')
    fs.mkdirSync(reference, { recursive: true })
    fs.writeFileSync(path.join(reference, 'originalHome.json'), JSON.stringify({ metadata: { title: 'Second title' } }))
    fs.writeFileSync(path.join(reference, 'seo.json'), JSON.stringify({
        links: [{
            href: 'https://media.example/icon.ico',
            rel: 'icon shortcut',
        }],
        meta: [{
            content: 'width=320, user-scalable=yes',
            name: 'viewport',
        }],
        title: 'Split content title',
    }))
    createSiteConfiguration({
        addVolume: () => {},
        containerHome: '/container',
        home: path.dirname(directory),
        multiThemed: true,
        process: 'site',
        repo,
        themeDirectories: ['theme01', 'theme02'],
    })
    const source = fs.readFileSync(path.join(directory, 'site', 'siteConfiguration.js'), 'utf8')
    const configuration = JSON.parse(source.replace(/^export default /, ''))
    assert.equal(configuration.themeTitles['01'], 'Travel')
    assert.equal(configuration.themeTitles['02'], 'Split content title')
    assert.deepEqual(configuration.themeViewports, { '02': 'width=320, user-scalable=yes' })
    assert.equal(configuration.themeBranding['02'].icons[0].href, 'https://media.example/icon.ico')
    assert.equal(configuration.themeBranding['02'].icons[0].rel, 'icon shortcut')
    assert.equal(configuration.themeDescriptions['01'], 'Reference description')
    assert.equal(source.includes('https://original.example/'), false)
})
