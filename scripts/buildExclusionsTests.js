import assert from 'assert/strict'
import {
    mkdirSync,
    mkdtempSync,
    readdirSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import test from 'node:test'
import buildExclusions from './buildExclusions.js'
import { deleteByPatterns } from './os.js'

test('artifact cleanup removes tests while retaining production modules', async t => {
    const directory = mkdtempSync(path.join(tmpdir(), 'buildExclusions'))
    t.after(() => rmSync(directory, { force: true, recursive: true }))
    const source = path.join(directory, 'api', 'feature')
    const tests = path.join(directory, 'api', 'test')
    const fixtures = path.join(directory, 'api', 'testFixtures')
    const sharedData = path.join(directory, 'api', 'testData')
    const generatedData = path.join(directory, 'api', 'node_modules', 'sampleTestData')
    mkdirSync(source, { recursive: true })
    mkdirSync(tests)
    mkdirSync(fixtures)
    mkdirSync(sharedData)
    mkdirSync(generatedData, { recursive: true })
    writeFileSync(path.join(source, 'find.js'), '')
    writeFileSync(path.join(source, 'findTests.js'), '')
    writeFileSync(path.join(tests, 'fixture.js'), '')
    writeFileSync(path.join(fixtures, 'mock.js'), '')
    writeFileSync(path.join(sharedData, 'record.js'), '')
    writeFileSync(path.join(generatedData, 'exports.js'), '')
    await deleteByPatterns(directory, buildExclusions)
    assert.deepEqual(readdirSync(source), ['find.js'])
    assert.deepEqual(readdirSync(path.join(directory, 'api')), ['feature', 'node_modules'])
    assert.deepEqual(readdirSync(path.join(directory, 'api', 'node_modules')), [])
})
