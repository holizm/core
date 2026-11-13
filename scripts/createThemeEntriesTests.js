import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import createThemeEntries from './createThemeEntries.js'

test('createThemeEntries includes only existing theme page components', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'themeEntries'))
    const repo = 'themeEntriesTest'
    const output = path.join('/tmp', repo)
    t.after(() => {
        fs.rmSync(home, {
            force: true,
            recursive: true,
        })
        fs.rmSync(output, {
            force: true,
            recursive: true,
        })
    })
    const processPath = path.join(home, 'sampleThemes', 'site')
    const pages = path.join(home, 'sampleThemes', 'theme01', 'pages')
    fs.mkdirSync(processPath, { recursive: true })
    fs.mkdirSync(pages, { recursive: true })
    fs.writeFileSync(path.join(pages, 'head.jsx'), 'export default null')
    const corePages = path.join(home, 'siteThemes', 'theme01', 'pages')
    fs.mkdirSync(corePages, { recursive: true })
    fs.writeFileSync(path.join(corePages, 'head.jsx'), 'export default null')
    createThemeEntries({
        multiThemed: true,
        process: 'site',
        processPath,
        repo,
        themeDirectories: ['theme01', 'theme02', '../siteThemes/theme01'],
    })
    const heads = fs.readFileSync(path.join(output, 'site', 'themeHeads', 'index.jsx'), 'utf8')
    const indexes = fs.readFileSync(path.join(output, 'site', 'themeIndexes', 'index.jsx'), 'utf8')
    assert.match(heads, /Theme01Head/)
    assert.match(heads, /'core01': Themecore01Head/)
    assert.match(heads, /themes\/core01\/pages\/head/)
    assert.doesNotMatch(heads, /Theme02Head/)
    assert.doesNotMatch(indexes, /Theme01Index/)
})

test('the index registry imports wrappers without evaluating other theme pages', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'themeIndexIsolation'))
    const repo = path.basename(home)
    const output = path.join('/tmp', repo, 'site', 'themeIndexes')
    t.after(() => fs.rmSync(home, {
        force: true,
        recursive: true,
    }))
    const processPath = path.join(home, 'site')
    for (const theme of ['theme01', 'theme02']) {
        const pages = path.join(home, theme, 'pages')
        fs.mkdirSync(pages, { recursive: true })
        fs.writeFileSync(path.join(pages, 'index.jsx'), `import missing from 'unavailableThemeResource'`)
    }
    createThemeEntries({
        multiThemed: true,
        process: 'site',
        processPath,
        repo,
        themeDirectories: ['theme01', 'theme02'],
    })
    const registry = fs.readFileSync(path.join(output, 'index.jsx'), 'utf8')
    assert.match(registry, /import Theme01Index from '\.\/01'/)
    assert.match(registry, /import Theme02Index from '\.\/02'/)
    assert.doesNotMatch(registry, /themes\//)
    assert.equal(fs.existsSync(path.join(output, '01.jsx')), true)
    assert.equal(fs.existsSync(path.join(output, '02.jsx')), true)
})
