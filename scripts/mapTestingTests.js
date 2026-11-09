import assert from 'assert/strict'
import {
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import test from 'node:test'
import mapTesting from './mapTesting.js'

test('all process types map shared and runnable part data through the same mechanism', context => {
    const home = mkdtempSync(path.join(tmpdir(), 'testingMapping'))
    context.after(() => rmSync(home, {
        force: true,
        recursive: true,
    }))
    for (const part of ['contacts', 'shop/housekeeping', 'unused', 'shop/empty']) {
        const root = path.join(home, part)
        mkdirSync(root, { recursive: true })
        writeFileSync(path.join(root, 'part'), '')
        if (part !== 'shop/empty') mkdirSync(path.join(root, 'testing'))
    }
    for (const processType of ['api', 'panel', 'site', 'mobile']) {
        const volumes = []
        mapTesting({
            addVolume: (...rest) => volumes.push(rest),
            containerHome: '/home/dev',
            dependencies: ['contacts', 'housekeeping', 'empty'],
            home,
            processType,
            repo: 'shopThemes',
        })
        assert.deepEqual(volumes, [
            [path.join(home, 'contacts/testing'), '/home/dev/testing/contacts:ro'],
            [path.join(home, 'shop/housekeeping/testing'), '/home/dev/testing/housekeeping:ro'],
        ])
    }
})
