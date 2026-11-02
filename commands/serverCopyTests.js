import assert from 'assert/strict'
import {
    readFileSync,
    utimesSync,
    writeFileSync,
} from 'fs'
import test from 'node:test'
import createFixture from './serverConnectionFixtureTests.js'

test('changed archives reuse matching data and preserve exact contents', async context => {
    const fixture = createFixture(context)
    const {
        bytes,
        copyFile,
        destinationPath,
        sourcePath,
        tools,
        writeTool,
    } = fixture
    await copyFile()
    assert.deepEqual(readFileSync(destinationPath), bytes)
    bytes.fill(7, 65536, 65664)
    writeFileSync(sourcePath, bytes)
    for (const path of [sourcePath, destinationPath]) {
        utimesSync(path, new Date(0), new Date(0))
    }
    const changed = await copyFile()
    const transferred = Number(changed.match(/Literal data: ([\d,]+) bytes/)[1].replaceAll(',', ''))
    context.diagnostic(`Updated ${bytes.length} bytes using ${transferred} transferred bytes`)
    assert.ok(transferred < bytes.length / 8)
    assert.deepEqual(readFileSync(destinationPath), bytes)
    assert.match(await copyFile(), /Literal data: 0 bytes/)
    writeTool('rsync', '#!/usr/bin/env bash\nexit 7\n')
    bytes[0] ^= 1
    writeFileSync(sourcePath, bytes)
    const previous = readFileSync(destinationPath)
    await assert.rejects(copyFile)
    assert.deepEqual(readFileSync(destinationPath), previous)
    writeTool('rsync', tools.rsync)
    writeTool('ssh', '#!/usr/bin/env bash\nexit 127\n')
    await copyFile()
    assert.deepEqual(readFileSync(destinationPath), bytes)
})
