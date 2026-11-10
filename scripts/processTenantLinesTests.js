import assert from 'assert/strict'
import {
    mock,
    test,
} from 'node:test'

mock.module('./loadProcessRuntimeSettings.js', { defaultExport: () => ({ internal: true }) })
mock.module('./createCertificate.js', { defaultExport: () => assert.fail('No certificates for internal processes') })
mock.module('./setupLocalDns.js', { defaultExport: () => assert.fail('No DNS for internal processes') })
mock.module('./setupWebServer.js', { defaultExport: () => assert.fail('No proxy for internal processes') })
const { default: processTenantLines } = await import('./processTenantLines.js')

test('internal processes skip tenant DNS, certificates and reverse proxy setup', async () => {
    assert.equal(await processTenantLines({}), false)
})
