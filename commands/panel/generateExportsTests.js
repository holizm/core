import assert from 'assert/strict'
import {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import test from 'node:test'
import generateExports from './generateExports.js'

test('panel exports include components and exclude sibling JSX tests', t => {
    const directory = mkdtempSync(path.join(tmpdir(), 'panelExports'))
    t.after(() => rmSync(directory, { force: true, recursive: true }))
    const source = path.join(directory, 'src', 'catalog', 'panel', 'item')
    mkdirSync(source, { recursive: true })
    writeFileSync(path.join(source, 'row.jsx'), 'export default <div />\n')
    writeFileSync(path.join(source, 'rowTests.jsx'), 'export default <div />\n')
    const removed = path.join(source, 'brandFields.jsx')
    writeFileSync(removed, 'export default <div />\n')
    const previousDirectory = process.cwd()
    try {
        process.chdir(directory)
        generateExports()
        rmSync(removed)
        generateExports()
    }
    finally {
        process.chdir(previousDirectory)
    }
    const exports = readFileSync(path.join(directory, 'src', 'catalog', 'panel.jsx'), 'utf8')
    assert.match(exports, /row'/)
    assert.doesNotMatch(exports, /rowTests/)
    assert.doesNotMatch(exports, /brandFields/)
})
