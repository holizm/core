import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import mapApiProcesses from './mapApiProcesses.js'

test('mapApiProcesses includes control, role, and site APIs', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'mapApiProcesses'))
    const repo = `${path.basename(home)}Control`
    const backingRepo = repo.replace(/Control$/, '')
    const outputDirectory = path.join(os.tmpdir(), repo)
    t.after(() => {
        fs.rmSync(home, { force: true, recursive: true })
        fs.rmSync(outputDirectory, { force: true, recursive: true })
    })
    fs.mkdirSync(path.join(home, repo, 'api'), { recursive: true })
    fs.mkdirSync(path.join(home, backingRepo, 'adminApi'), { recursive: true })
    fs.mkdirSync(path.join(home, backingRepo, 'siteApi'))
    fs.mkdirSync(path.join(outputDirectory, 'panel'), { recursive: true })
    const volumes = []
    mapApiProcesses({
        addVolume: (...args) => volumes.push(args),
        containerHome: '/home/dev',
        home,
        process: 'panel',
        repo,
    })
    const file = path.join(outputDirectory, 'panel', 'apiProcesses.json')
    const processes = JSON.parse(fs.readFileSync(file, 'utf8'))
    assert.deepEqual(processes.map(item => item.role), ['admin', 'control', ''])
    assert.ok(volumes.some(([source, target]) => source === file && target.endsWith('/apiProcesses.json')))
})
