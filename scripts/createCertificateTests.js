import assert from 'assert/strict'
import { execFileSync } from 'child_process'
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

for (const trusted of [true, false]) {
    test(`createCertificate checks existing certificate authority trust: ${trusted}`, async t => {
        const certificatesPath = fs.mkdtempSync(path.join(os.tmpdir(), 'existingCertificate'))
        t.after(() => fs.rmSync(certificatesPath, { force: true, recursive: true }))
        const base = path.join(certificatesPath, 'shop')
        fs.mkdirSync(base)
        execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
            '-subj', '/CN=shop.local', '-addext', 'subjectAltName=DNS:shop.local,DNS:other.local',
            '-keyout', path.join(base, 'key.pem'), '-out', path.join(base, 'certificate.pem')], { stdio: 'ignore' })
        const calls = []
        globalThis.mockRunOnTerminalAsync = command => {
            calls.push(command)
            if (!trusted && command.startsWith('openssl verify')) throw new Error('Untrusted issuer')
        }
        try {
            assert.equal(await createCertificate({ certificatesPath, host: 'shop.local', tenant: 'shop' }), !trusted)
            assert.match(calls[0], /openssl verify.*mkcert -CAROOT/)
            if (!trusted) {
                assert.match(calls[1], /mkcert -cert-file/)
                assert.match(calls[1], /other\.local/)
            } else {
                assert.equal(calls.length, 1)
            }
        }
        finally {
            delete globalThis.mockRunOnTerminalAsync
        }
    })
}
