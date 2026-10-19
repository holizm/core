import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import createSiteConfiguration from './createSiteConfiguration.js'

test('createSiteConfiguration records the selected theme numbers', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'siteConfiguration'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    const repo = path.basename(directory)
    const volumes = []
    createSiteConfiguration({
        addVolume: (...rest) => volumes.push(rest),
        containerHome: '/container',
        home: '/source',
        multiThemed: true,
        process: 'site',
        repo,
        themeDirectories: ['theme01', 'theme12'],
    })
    const source = fs.readFileSync(path.join(directory, 'site', 'siteConfiguration.js'), 'utf8')
    const configuration = JSON.parse(source.replace(/^export default /, ''))
    assert.deepEqual(configuration, {
        multiThemed: true,
        themeNumbers: ['01', '12'],
    })
    assert.deepEqual(volumes, [[
        '/source/site/buildRichTextRegistry.js',
        `/container/${repo}/site/buildRichTextRegistry.js`,
    ]])
})

test('single-themed composition maps the registry builder beside its collector', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'siteConfiguration'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
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
