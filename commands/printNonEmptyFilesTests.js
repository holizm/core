import assert from 'assert/strict'
import {
    mkdtemp,
    mkdir,
    readFile,
    rm,
    writeFile,
} from 'fs/promises'
import os from 'os'
import path from 'path'
import test from 'node:test'
import { runOnTerminalAsync } from '../scripts/terminal.js'

test('prints names and content recursively, skipping only empty content and containers', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'printNonEmptyFiles'))
    try {
        await mkdir(path.join(directory, 'nested'))
        const entries = {
            '.hidden': 'Hidden content',
            'empty': '',
            'emptyArray.json': ' [\n] ',
            'emptyObject.json': ' {\n} ',
            'false.json': 'false',
            'invalid.json': '{invalid',
            'nested/file name': 'Nested content',
            'null.json': 'null',
            'number.json': '0',
            'object.json': '{"items":[]}',
            'text': 'Text content',
            'values.json': '[0,false]',
            'whitespace': ' \n\t',
        }
        for (const [name, content] of Object.entries(entries)) {
            await writeFile(path.join(directory, name), content)
        }
        const command = path.join(import.meta.dirname, 'printNonEmptyFiles')
        for (const argument of ['', '.']) {
            const output = await runOnTerminalAsync(`${command} ${argument}`, {
                cwd: directory,
                throwOnError: true,
            })
            const expected = Object.entries(entries)
                .filter(([name]) => !['empty', 'emptyArray.json', 'emptyObject.json', 'whitespace'].includes(name))
                .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
                .map(([name, content]) => `${name}\n${content}\n--------------------\n`)
                .join('').trim()
            assert.equal(output, expected)
        }
        for (const [name, content] of Object.entries(entries)) {
            assert.equal(await readFile(path.join(directory, name), 'utf8'), content)
        }
        const output = await runOnTerminalAsync(`${command} nested`, {
            cwd: directory,
            throwOnError: true,
        })
        assert.equal(output, 'nested/file name\nNested content\n--------------------')
    }
    finally {
        await rm(directory, {
            force: true,
            recursive: true,
        })
    }
})
