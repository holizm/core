import assert from 'assert/strict'
import { execFileSync } from 'child_process'
import {
    mkdtempSync,
    mkdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import test from 'node:test'

test('generated site barrels exclude sibling tests', () => {
    const home = mkdtempSync(path.join(tmpdir(), 'siteExports'))
    const directory = path.join(home, 'example/site/src/pageParts/shared')
    mkdirSync(directory, { recursive: true })
    for (const name of ['reloadButton', 'reloadButtonTest', 'reloadButtonTests']) {
        writeFileSync(path.join(directory, `${name}.jsx`), 'export default () => null\n')
    }
    try {
        execFileSync(process.execPath, [new URL('./generateExports.js', import.meta.url).pathname, 'shared', 'pageParts'], {
            env: {
                ...process.env,
                home,
                process: 'site',
                repo: 'example',
            },
        })
        const content = readFileSync(path.join(directory, '../sharedExports.jsx'), 'utf8')
        assert.match(content, /reloadButton/)
        assert.doesNotMatch(content, /reloadButtonTests?/)
    }
    finally {
        rmSync(home, { force: true, recursive: true })
    }
})
