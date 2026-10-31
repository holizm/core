import assert from 'assert/strict'
import { fork } from 'child_process'
import { once } from 'events'
import {
    mkdtempSync,
    renameSync,
    rmSync,
    writeFileSync,
} from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'

test('a worker reports breaches and resets the status before checking the next file', { timeout: 30000 }, async t => {
    const created = mkdtempSync(path.join(os.tmpdir(), 'policyWorker'))
    const directory = created.toLowerCase()
    renameSync(created, directory)
    t.after(() => rmSync(directory, {
        force: true,
        recursive: true,
    }))
    const invalid = path.join(directory, 'invalid.json')
    const valid = path.join(directory, 'valid.json')
    writeFileSync(invalid, '[] \n')
    writeFileSync(valid, '[]\n')
    const worker = fork(path.join(import.meta.dirname, 'checkPolicyWorker.js'), [], {
        stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
    })
    t.after(() => worker.kill())
    const check = file => new Promise(resolve => {
        const receive = message => {
            if (message.type !== 'done') return
            worker.off('message', receive)
            resolve(message)
        }
        worker.on('message', receive)
        worker.send({ file })
    })
    const failure = await check(invalid)
    assert.equal(failure.code, 1, failure.output)
    assert.match(failure.output, /Trimmed Lines/)
    const success = await check(valid)
    assert.equal(success.code, 0, success.output)
    assert.equal(success.output, '')
    const exited = once(worker, 'exit')
    worker.send({ type: 'stop' })
    assert.equal((await exited)[0], 0)
})
