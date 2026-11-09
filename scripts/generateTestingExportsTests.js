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
import generateTestingExports from './generateTestingExports.js'

test('generated aliases expose data factories, qualify nested names, and exclude tests', async context => {
    const home = mkdtempSync(path.join(tmpdir(), 'testingExports'))
    context.after(() => rmSync(home, {
        force: true,
        recursive: true,
    }))
    const root = path.join(home, 'testing/housekeeping')
    mkdirSync(path.join(root, 'room'), { recursive: true })
    writeFileSync(path.join(root, 'cleaningSupplyUse.js'), 'export default () => ({ quantity: 3 })')
    writeFileSync(path.join(root, 'room/occupied.js'), 'export default { occupied: true }')
    writeFileSync(path.join(root, 'recordTests.js'), 'throw new Error()')
    const outputDirectory = path.join(home, 'generated')
    const aliases = await generateTestingExports({
        home,
        outputDirectory,
    })
    const {
        cleaningSupplyUse,
        roomOccupied,
    } = await import(aliases.housekeepingTesting)
    assert.deepEqual(cleaningSupplyUse(), { quantity: 3 })
    assert.notEqual(cleaningSupplyUse(), cleaningSupplyUse())
    assert.equal(roomOccupied.occupied, true)
    assert.equal(readFileSync(path.join(outputDirectory, 'housekeepingTesting.mjs'), 'utf8').includes('recordTests'), false)
    writeFileSync(path.join(root, 'roomOccupied.js'), 'export default true')
    await assert.rejects(generateTestingExports({
        home,
        outputDirectory,
    }), /Duplicate test support export/)
})

test('processes without mapped test support have no additional aliases', async () => {
    const aliases = await generateTestingExports({
        home: '/tmp/nonexistentTestingHome',
        outputDirectory: '/tmp/nonexistentTestingOutput',
    })
    assert.deepEqual(aliases, {})
})

test('local standalone and runnable parts expose their shared testing directory', async context => {
    const home = mkdtempSync(path.join(tmpdir(), 'localTestingExports'))
    context.after(() => rmSync(home, { force: true, recursive: true }))
    for (const part of ['contacts', 'hotelOs/housekeeping']) {
        const root = path.join(home, part)
        mkdirSync(path.join(root, 'testing'), { recursive: true })
        writeFileSync(path.join(root, 'part'), '')
        writeFileSync(path.join(root, 'testing/record.js'), 'export default true')
    }
    const aliases = await generateTestingExports({
        home,
        outputDirectory: path.join(home, 'generated'),
    })
    assert.equal((await import(aliases.contactsTesting)).default, undefined)
    assert.equal((await import(aliases.contactsTesting)).record, true)
    assert.equal((await import(aliases.housekeepingTesting)).record, true)
})
