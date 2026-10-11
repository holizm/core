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
        fs.rmSync(home, { recursive: true, force: true })
        fs.rmSync(output, { recursive: true, force: true })
    })
    const processPath = path.join(home, 'site')
    const pages = path.join(home, 'theme01', 'pages')
    fs.mkdirSync(processPath)
    fs.mkdirSync(pages, { recursive: true })
    fs.writeFileSync(path.join(pages, 'head.jsx'), 'export default null')
    createThemeEntries({
        multiThemed: true,
        process: 'site',
        processPath,
        repo,
        themeDirectories: ['theme01', 'theme02'],
    })
    const heads = fs.readFileSync(path.join(output, 'site', 'themeHeads', 'index.jsx'), 'utf8')
    const indexes = fs.readFileSync(path.join(output, 'site', 'themeIndexes', 'index.jsx'), 'utf8')
    assert.match(heads, /Theme01Head/)
    assert.doesNotMatch(heads, /Theme02Head/)
    assert.doesNotMatch(indexes, /Theme01Index/)
})
