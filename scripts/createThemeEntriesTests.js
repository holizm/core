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
    const processPath = path.join(home, 'site')
    const pages = path.join(home, 'theme01', 'pages')
    fs.mkdirSync(processPath)
    fs.mkdirSync(pages, { recursive: true })
    fs.writeFileSync(path.join(pages, 'head.jsx'), 'export default null')
    fs.symlinkSync('theme01', path.join(home, 'coreTheme01'))
    createThemeEntries({
        multiThemed: true,
        process: 'site',
        processPath,
        repo,
        themeDirectories: ['theme01', 'theme02', 'coreTheme01'],
    })
    const heads = fs.readFileSync(path.join(output, 'site', 'themeHeads', 'index.jsx'), 'utf8')
    const indexes = fs.readFileSync(path.join(output, 'site', 'themeIndexes', 'index.jsx'), 'utf8')
    assert.match(heads, /Theme01Head/)
    assert.match(heads, /'core01': Themecore01Head/)
    assert.match(heads, /themes\/core01\/pages\/head/)
    assert.doesNotMatch(heads, /Theme02Head/)
    assert.doesNotMatch(indexes, /Theme01Index/)
})
