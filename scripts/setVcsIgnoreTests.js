import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'

test('setVcsIgnore copies shared ignore rules into a repository', async t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'vcsIgnore'))
    t.after(() => fs.rmSync(home, { force: true, recursive: true }))
    fs.mkdirSync(path.join(home, 'core'))
    fs.writeFileSync(path.join(home, 'core', 'vcsIgnore'), 'node_modules\n')
    const repo = path.join(home, 'shop')
    fs.mkdirSync(repo)
    const previousHome = process.env.HOME
    process.env.HOME = home
    let setVcsIgnore
    try {
        const module = await import(`./setVcsIgnore.js?home=${encodeURIComponent(home)}`)
        setVcsIgnore = module.default
    }
    finally {
        process.env.HOME = previousHome
    }
    await setVcsIgnore(repo)
    assert.equal(fs.readFileSync(path.join(repo, '.git', 'info', 'exclude'), 'utf8'), 'node_modules\n')
})
