import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { registerHooks } from 'module'
import { test } from 'node:test'

const mockUrl = new URL('./testFixtures/mockRunStreaming.js', import.meta.url).href
registerHooks({
    resolve: (specifier, context, nextResolve) => specifier.endsWith('/terminal.js')
        ?
        { shortCircuit: true, url: mockUrl }
        :
        nextResolve(specifier, context),
})
const { default: createCertificate } = await import('./createCertificate.js')

test('createCertificate requests a certificate for the tenant host', async t => {
    const certificatesPath = fs.mkdtempSync(path.join(os.tmpdir(), 'tenantCertificates'))
    t.after(() => fs.rmSync(certificatesPath, { force: true, recursive: true }))
    const calls = []
    globalThis.mockRunOnTerminalAsync = (...rest) => calls.push(rest)
    try {
        assert.equal(await createCertificate({
            certificatesPath,
            host: 'shop.local',
            tenant: 'shop',
        }), true)
        assert.equal(fs.statSync(path.join(certificatesPath, 'shop')).isDirectory(), true)
        assert.match(calls[0][0], /mkcert -cert-file/)
        assert.match(calls[0][0], /shop\.local/)
        assert.deepEqual(calls[0][1], { throwOnError: true })
    }
    finally {
        delete globalThis.mockRunOnTerminalAsync
    }
})
