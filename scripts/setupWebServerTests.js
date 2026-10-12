import assert from 'assert/strict'
import { registerHooks } from 'module'
import { test } from 'node:test'

const mockUrl = new URL('./testFixtures/mockWebServerTemplates.js', import.meta.url).href
registerHooks({
    resolve: (specifier, context, nextResolve) => specifier.endsWith('/os.js')
        ?
        { shortCircuit: true, url: mockUrl }
        :
        nextResolve(specifier, context),
})
const { default: setupWebServer } = await import('./setupWebServer.js')

test('setupWebServer writes locale-aware configuration and includes', () => {
    const calls = []
    globalThis.mockWebServerTemplates = (source, target, params) => {
        calls.push({ source, target, params })
        return target.endsWith('.conf')
    }
    try {
        assert.equal(setupWebServer({
            home: '/home/dev',
            host: 'shop.local',
            locales: 'en,fa,',
            webServerPath: '/tmp/webServer',
        }), true)
        assert.equal(calls.length, 2)
        assert.equal(calls[0].target, '/tmp/webServer/conf.d/shop.local.conf')
        assert.equal(calls[1].target, '/tmp/webServer/includes/shop.local')
        assert.equal(calls[0].params.localesRegex, 'en|fa')
    }
    finally {
        delete globalThis.mockWebServerTemplates
    }
})
