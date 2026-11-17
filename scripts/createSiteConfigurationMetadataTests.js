import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import createSiteConfiguration from './createSiteConfiguration.js'

test('preview metadata reuses declared SEO fields without exposing asset stylesheets', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'themePreviewMetadata'))
    t.after(() => fs.rmSync(directory, {
        force: true,
        recursive: true,
    }))
    const data = path.join(directory, 'theme01', 'data')
    fs.mkdirSync(data, { recursive: true })
    const meta = [{
        content: 'Reference description',
        name: 'description',
    }]
    fs.writeFileSync(path.join(data, 'seo.json'), JSON.stringify({
        canonical: 'https://reference.example/',
        links: [{
            href: 'https://media.example/icon.ico',
            rel: 'icon',
        }, {
            href: 'https://media.example/fonts.css',
            rel: 'stylesheet',
        }],
        meta,
        title: 'Reference title',
    }))
    createSiteConfiguration({
        addVolume: () => {},
        containerHome: '/container',
        home: path.dirname(directory),
        multiThemed: true,
        process: 'site',
        repo: path.basename(directory),
        themeDirectories: ['theme01'],
    })
    const source = fs.readFileSync(path.join(directory, 'site', 'siteConfiguration.js'), 'utf8')
    const configuration = JSON.parse(source.replace(/^export default /, ''))
    assert.deepEqual(configuration.themeMetadata['01'], {
        links: [{
            href: 'https://reference.example/',
            rel: 'canonical',
        }],
        meta,
    })
    assert.equal(configuration.themeBranding['01'].icons[0].href, 'https://media.example/icon.ico')
    assert.equal(source.includes('fonts.css'), false)
})
