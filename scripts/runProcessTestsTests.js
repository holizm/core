import assert from 'assert/strict'
import { execFileSync } from 'child_process'
import {
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import test from 'node:test'

test('process tests discover nested siblings and fail on a failed test', t => {
    const directory = mkdtempSync(path.join(tmpdir(), 'processTests'))
    t.after(() => rmSync(directory, { force: true, recursive: true }))
    const nested = path.join(directory, 'src', 'components')
    mkdirSync(nested, { recursive: true })
    const support = path.join(directory, 'testing')
    const integration = path.join(directory, 'integrationTests')
    mkdirSync(support)
    mkdirSync(integration)
    for (const name of ['runProcessTests', 'runTests']) {
        writeFileSync(path.join(directory, `${name}.js`), `throw new Error('runners must not execute as tests')\n`)
        writeFileSync(path.join(directory, `${name}Tests.js`), `import test from 'test'\ntest('runner source', () => {})\n`)
    }
    const suite = path.join(directory, 'policy', 'runTests.js')
    mkdirSync(path.dirname(suite))
    writeFileSync(suite, `import test from 'test'\ntest('run unit tests stay discoverable', () => {})\n`)
    writeFileSync(path.join(support, 'mockProvider.js'), "throw new Error('support must not execute')\n")
    writeFileSync(path.join(support, 'recordTests.js'), "throw new Error('support must not execute')\n")
    writeFileSync(path.join(integration, 'workflowTests.js'), "import test from 'test'\ntest('workflow', () => {})\n")
    const file = path.join(nested, 'rowTests.js')
    writeFileSync(file, "import test from 'test'\ntest('row', () => {})\n")
    const command = path.join(import.meta.dirname, 'runProcessTests.js')
    assert.doesNotThrow(() => execFileSync(process.execPath, [command], { cwd: directory }))
    writeFileSync(file, "import test from 'test'\ntest('row', () => { throw new Error('failed') })\n")
    assert.throws(() => execFileSync(process.execPath, [command], {
        cwd: directory,
        stdio: 'pipe',
    }))
})

test('process tests enforce a configured timeout for stalled suites', t => {
    const directory = mkdtempSync(path.join(tmpdir(), 'processTimeout'))
    t.after(() => rmSync(directory, { force: true, recursive: true }))
    const file = path.join(directory, 'stallTests.js')
    writeFileSync(file, `import test from 'test'\ntest('waiting', () => new Promise(resolve => setTimeout(resolve, 10000)))\n`)
    const command = path.join(import.meta.dirname, 'runProcessTests.js')
    const startedAt = Date.now()
    assert.throws(() => execFileSync(process.execPath, [command], {
        cwd: directory,
        env: {
            ...process.env,
            testTimeoutMilliseconds: '500',
        },
        stdio: 'pipe',
    }), e => e.stdout.toString().includes('timed out'))
    assert.ok(Date.now() - startedAt < 5000)
})
