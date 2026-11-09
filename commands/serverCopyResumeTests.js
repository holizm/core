import assert from 'assert/strict'
import { randomBytes } from 'crypto'
import {
    existsSync,
    readFileSync,
    statSync,
    writeFileSync,
} from 'fs'
import test from 'node:test'
import { join } from 'path'
import createFixture from '../testing/commands/serverConnectionEnvironmentProvider.js'

test('interrupted transfers retain partial data without replacing the published archive', async context => {
    const fixture = createFixture(context)
    await fixture.copyFile()
    const previous = readFileSync(fixture.destinationPath)
    const bytes = randomBytes(fixture.bytes.length)
    writeFileSync(fixture.sourcePath, bytes)
    fixture.writeTool('rsync', '#!/usr/bin/env bash\nexec /usr/bin/rsync --bwlimit=64 --stats "$@"\n')
    await assert.rejects(() => fixture.copyFile('timeout --kill-after=1s 1s '))
    assert.deepEqual(readFileSync(fixture.destinationPath), previous)
    const partial = join(fixture.directory, 'transferCache', 'targetArchive.zip')
    assert.equal(existsSync(partial), true)
    assert.ok(statSync(partial).size > 0)
    fixture.writeTool('rsync', fixture.tools.rsync)
    const resumed = await fixture.copyFile()
    assert.match(resumed, /Matched data: [1-9][\d,]* bytes/)
    assert.deepEqual(readFileSync(fixture.destinationPath), bytes)
    assert.equal(existsSync(partial), false)
})
