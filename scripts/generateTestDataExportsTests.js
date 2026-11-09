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
import generateTestDataExports from './generateTestDataExports.js'

test('generated aliases expose data factories, qualify nested names, and exclude tests', async context => {
    const home = mkdtempSync(path.join(tmpdir(), 'testDataExports'))
    context.after(() => rmSync(home, {
        force: true,
        recursive: true,
    }))
    const root = path.join(home, 'testData/housekeeping')
    mkdirSync(path.join(root, 'room'), { recursive: true })
    writeFileSync(path.join(root, 'cleaningSupplyUse.js'), 'export default () => ({ quantity: 3 })')
    writeFileSync(path.join(root, 'room/occupied.js'), 'export default { occupied: true }')
    writeFileSync(path.join(root, 'recordTests.js'), 'throw new Error()')
    const outputDirectory = path.join(home, 'generated')
    const aliases = await generateTestDataExports({
        home,
        outputDirectory,
    })
    const {
        cleaningSupplyUse,
        roomOccupied,
    } = await import(aliases.housekeepingTestData)
    assert.deepEqual(cleaningSupplyUse(), { quantity: 3 })
    assert.notEqual(cleaningSupplyUse(), cleaningSupplyUse())
    assert.equal(roomOccupied.occupied, true)
    assert.equal(readFileSync(path.join(outputDirectory, 'housekeepingTestData.mjs'), 'utf8').includes('recordTests'), false)
    writeFileSync(path.join(root, 'roomOccupied.js'), 'export default true')
    await assert.rejects(generateTestDataExports({
        home,
        outputDirectory,
    }), /Duplicate test data export/)
})

test('processes without mapped test data have no additional aliases', async () => {
    const aliases = await generateTestDataExports({
        home: '/tmp/nonexistentTestDataHome',
        outputDirectory: '/tmp/nonexistentTestDataOutput',
    })
    assert.deepEqual(aliases, {})
})
