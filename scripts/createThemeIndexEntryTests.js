import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import createThemeIndexEntry from './createThemeIndexEntry.js'

test('theme index entries preserve the component interface and defer loading their page', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'themeIndexEntry'))
    t.after(() => fs.rmSync(directory, {
        force: true,
        recursive: true,
    }))
    createThemeIndexEntry({
        directory,
        theme: 'core102',
    })
    const source = fs.readFileSync(path.join(directory, 'core102.jsx'), 'utf8')
    assert.match(source, /export default component\$\(async props/)
    assert.match(source, /await import\('\.\.\/themes\/core102\/pages\/index'\)/)
    assert.match(source, /<Index \{\.\.\.props\} \/>/)
    assert.doesNotMatch(source, /import .* from '\.\.\/themes\//)
})
