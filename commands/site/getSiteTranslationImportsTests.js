import assert from 'assert/strict'
import test from 'node:test'
import getSiteTranslationImports from './getSiteTranslationImports.js'

test('follows imports, re-exports and lazy imports without executing source', () => {
    const source = `
        import Header from 'header'
        export { default } from 'footer'
        export * from './labels.js'
        const load = () => import('lazyDialog')
        const unrelated = 'unusedModule'
    `
    assert.deepEqual([...getSiteTranslationImports(source)], ['header', 'footer', './labels.js', 'lazyDialog'])
})
