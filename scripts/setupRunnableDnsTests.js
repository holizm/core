import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { registerHooks } from 'module'
import { test } from 'node:test'

const mockUrl = new URL('./testFixtures/mockRunnableDns.js', import.meta.url).href
registerHooks({
    resolve: (specifier, context, nextResolve) => specifier === 'dns/promises' || specifier.endsWith('/setupLocalDns.js')
        ?
        { shortCircuit: true, url: mockUrl }
        :
        nextResolve(specifier, context),
})
const { default: setupRunnableDns } = await import('./setupRunnableDns.js')

test('setupRunnableDns skips CI and control runnables', async () => {
    assert.equal(await setupRunnableDns({ isCiCd: true, repo: 'shop' }), false)
    assert.equal(await setupRunnableDns({ repo: 'shopControl' }), false)
})

test('setupRunnableDns uses configured IPs and resolves other domains', async t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'runnableDns'))
    t.after(() => fs.rmSync(home, { force: true, recursive: true }))
    fs.mkdirSync(path.join(home, 'secrets'))
    fs.writeFileSync(path.join(home, 'secrets/shop.json'), JSON.stringify({
        deployment: {
            instances: [
                { domain: 'first.example.com', serverDirectory: 'first' },
                { domain: 'second.example.com', serverDirectory: 'second' },
            ],
        },
        ssh: {
            domains: ['first.example.com'],
            ip: '192.0.2.1',
        },
    }))
    const calls = []
    globalThis.mockRunnableDnsLookup = domain => {
        calls.push(domain)
        return { address: '192.0.2.2' }
    }
    globalThis.mockSetupLocalDns = params => {
        calls.push(params)
        return true
    }
    try {
        assert.equal(await setupRunnableDns({ home, repo: 'shop' }), true)
        assert.equal(calls[0], 'second.example.com')
        assert.deepEqual(calls[1].hosts, [
            'shop.local',
            { host: 'first.prod', ip: '192.0.2.1' },
            { host: 'second.prod', ip: '192.0.2.2' },
        ])
    }
    finally {
        delete globalThis.mockRunnableDnsLookup
        delete globalThis.mockSetupLocalDns
    }
})

test('setupRunnableDns rejects incomplete deployment instances', async t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'runnableDnsInvalid'))
    t.after(() => fs.rmSync(home, { force: true, recursive: true }))
    fs.mkdirSync(path.join(home, 'secrets'))
    fs.writeFileSync(path.join(home, 'secrets/shop.json'), JSON.stringify({
        deployment: { instances: [{ domain: 'example.com' }] },
    }))
    await assert.rejects(setupRunnableDns({ home, repo: 'shop' }), /Invalid deployment instance/)
})
