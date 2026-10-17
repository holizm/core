import assert from 'assert/strict'
import test from 'node:test'
import getSiteTranslationTokens from './getSiteTranslationTokens.js'

test('finds lazy and conditional labels, scoped resolver arguments and optional property access', () => {
    const source = `
        import lazy from 'lazyModule'
        const label = copied ? translations.value?.coreCopied : translations?.coreCopy
        const title = resolveTranslation(translations, 'editProfile', 'accounts')
        const menu = [{ title: 'dashboard' }]
    `
    const tokens = getSiteTranslationTokens(source)
    for (const key of ['lazyModule', 'coreCopied', 'coreCopy', 'editProfile', 'accounts', 'dashboard']) {
        assert.ok(tokens.has(key), key)
    }
    assert.ok(!tokens.has('copied'))
})
