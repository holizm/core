import assert from 'assert/strict'
import { registerHooks } from 'module'
import test from 'node:test'

const gateUrl = new URL('./testFixtures/mockBuildGate.js', import.meta.url).href
const stopUrl = new URL('./testFixtures/mockBuildStart.js', import.meta.url).href
registerHooks({
    resolve: (specifier, context, nextResolve) => {
        if (specifier.endsWith('/runBuildTests.js')) return { shortCircuit: true, url: gateUrl }
        if (specifier.endsWith('/stop.js')) return { shortCircuit: true, url: stopUrl }
        const result = nextResolve(specifier, context)
        return result
    },
})
const { default: buildNewSite } = await import('./buildNewSite.js')

test('new site build stops before compilation when tests fail', async () => {
    await assert.rejects(buildNewSite({ isSite: true }), /test gate failed/)
})
