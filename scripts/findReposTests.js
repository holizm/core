import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'

test('findRepos filters top-level repositories by name', async t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'findRepos'))
    t.after(() => fs.rmSync(home, { force: true, recursive: true }))
    for (const repo of ['orders', 'OrderControl', 'blog']) {
        fs.mkdirSync(path.join(home, repo, '.git'), { recursive: true })
    }
    const previousHome = process.env.HOME
    process.env.HOME = home
    let findRepos
    try {
        const module = await import(`./findRepos.js?home=${encodeURIComponent(home)}`)
        findRepos = module.default
    }
    finally {
        process.env.HOME = previousHome
    }
    assert.deepEqual(findRepos('ORDER/').sort(), [
        path.join(home, 'OrderControl'),
        path.join(home, 'orders'),
    ].sort())
    assert.deepEqual(findRepos('missing'), [])
})
