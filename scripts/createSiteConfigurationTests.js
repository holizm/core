import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import createSiteConfiguration from './createSiteConfiguration.js'

test('createSiteConfiguration records the selected theme numbers', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'siteConfiguration'))
    t.after(() => fs.rmSync(directory, {
        force: true,
        recursive: true,
    }))
    const repo = path.basename(directory)
    const volumes = []
    createSiteConfiguration({
        addVolume: (...rest) => volumes.push(rest),
        containerHome: '/container',
        home: '/source',
        multiThemed: true,
        process: 'site',
        repo,
        themeDirectories: ['theme01', 'theme12', '../siteThemes/theme01'],
    })
    const source = fs.readFileSync(path.join(directory, 'site', 'siteConfiguration.js'), 'utf8')
    const configuration = JSON.parse(source.replace(/^export default /, ''))
    assert.deepEqual(configuration, {
        multiThemed: true,
        themeNumbers: ['01', '12', 'core01'],
    })
    assert.deepEqual(volumes, [[
        '/source/site/buildRichTextRegistry.js',
        `/container/${repo}/site/buildRichTextRegistry.js`,
    ]])
})

test('single-themed composition maps the registry builder beside its collector', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'siteConfiguration'))
    t.after(() => fs.rmSync(directory, {
        force: true,
        recursive: true,
    }))
    const repo = path.basename(directory)
    const volumes = []
    createSiteConfiguration({
        addVolume: (...rest) => volumes.push(rest),
        containerHome: '/container',
        home: '/source',
        multiThemed: false,
        process: 'site',
        repo,
    })
    assert.deepEqual(volumes, [[
        '/source/site/buildRichTextRegistry.js',
        `/container/${repo}/site/buildRichTextRegistry.js`,
    ]])
})

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
    assert.equal(configuration.themeTitles['02'], 'Second title')
    assert.equal(configuration.themeDescriptions['01'], 'Reference description')
    assert.equal(source.includes('https://original.example/'), false)
})
