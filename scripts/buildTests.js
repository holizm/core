import assert from 'assert/strict'
import { registerHooks } from 'module'
import test from 'node:test'

const gateUrl = new URL('./testFixtures/mockBuildGate.js', import.meta.url).href
const startUrl = new URL('./testFixtures/mockBuildStart.js', import.meta.url).href
registerHooks({
    resolve: (specifier, context, nextResolve) => {
        if (specifier.endsWith('/runBuildTests.js')) return { shortCircuit: true, url: gateUrl }
        if (specifier.endsWith('/start.js')) return { shortCircuit: true, url: startUrl }
        if (specifier.endsWith('/stop.js')) return { shortCircuit: true, url: startUrl }
        const result = nextResolve(specifier, context)
        return result
    },
})
const { default: build } = await import('./build.js')

test('standard build stops before compilation when tests fail', async () => {
    await assert.rejects(build({ isPanel: true }), /test gate failed/)
})
