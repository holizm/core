import assert from 'assert/strict'
import { readFileSync } from 'fs'
import { test } from 'node:test'
import { runInNewContext } from 'vm'

const page = readFileSync(new URL('./502.html', import.meta.url), 'utf8')
const proxy = readFileSync(new URL('./reverseProxy', import.meta.url), 'utf8')
const appearanceScript = page.match(/<script>([\s\S]*?)<\/script>/)[1]

test('the proxy serves the unavailable page internally and preserves the status', () => {
    assert.match(proxy, /error_page 502 \/502\.html;/)
    assert.match(proxy, /location \/502\s*\{[\s\S]*?\binternal;/)
    assert.match(page, /<h1>The site is temporarily unavailable<\/h1>/)
    assert.match(page, /<a href=''>Try again<\/a>/)
})

test('explicit appearance overrides the system and storage changes are applied', () => {
    let mode = 'dark'
    let onStorage
    const dataset = {}
    runInNewContext(appearanceScript, {
        document: { documentElement: { dataset } },
        localStorage: { getItem: key => {
            assert.equal(key, 'theme')
            return mode
        } },
        window: { addEventListener: (event, listener) => {
            assert.equal(event, 'storage')
            onStorage = listener
        } },
    })
    assert.equal(dataset.theme, 'dark')
    mode = 'light'
    onStorage()
    assert.equal(dataset.theme, 'light')
    mode = 'system'
    onStorage()
    assert.equal(dataset.theme, '')
    assert.match(page, /name='color-scheme' content='light dark'/)
})

test('unavailable storage leaves the browser color scheme in control', () => {
    const dataset = {}
    runInNewContext(appearanceScript, {
        document: { documentElement: { dataset } },
        localStorage: { getItem: () => { throw new Error('Unavailable') } },
        window: { addEventListener: () => {} },
    })
    assert.equal(dataset.theme, undefined)
})
