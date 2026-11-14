import assert from 'assert/strict'
import test from 'node:test'
import './multiThemedIndexTemplate.jsx'

test('registered home sections retain their API order alongside existing values', async () => {
    const sections = [{ sectionKey: 'hero' }, { sectionKey: 'details' }]
    globalThis.indexTemplateValues = { blog: ['article'] }
    globalThis.indexTemplateComposition = {
        hasSections: true,
        sections,
    }
    globalThis.indexTemplateGlobalization = { locale: 'en' }
    globalThis.indexTemplateTenant = { theme: 'core064' }
    const request = { url: new URL('https://example.test/') }
    const data = await globalThis.indexTemplateLoader(request)
    assert.equal(data.hasSections, true)
    assert.equal(data.sections, sections)
    assert.deepEqual(data.blog, ['article'])
    assert.equal(data.globalization, globalThis.indexTemplateGlobalization)
    assert.equal(data.theme, 'core064')
})

test('homes without registered parts preserve their existing section data', async () => {
    const sections = ['legacy']
    globalThis.indexTemplateValues = {
        hasSections: false,
        sections,
        title: 'Existing home',
    }
    globalThis.indexTemplateComposition = {
        hasSections: false,
        sections: [],
    }
    const data = await globalThis.indexTemplateLoader({})
    assert.equal(data.hasSections, false)
    assert.equal(data.sections, sections)
    assert.equal(data.title, 'Existing home')
})

test('an unavailable page descriptor preserves legacy values', async () => {
    globalThis.indexTemplateValues = { title: 'Existing home' }
    globalThis.indexTemplateComposition = { statusCode: 404 }
    const data = await globalThis.indexTemplateLoader({})
    assert.equal(data.title, 'Existing home')
    assert.equal(data.hasSections, undefined)
})

test('home values and registered composition receive the same request context', async () => {
    globalThis.indexTemplateRequests = []
    globalThis.indexTemplateValues = { title: 'Home' }
    globalThis.indexTemplateComposition = { hasSections: false }
    const request = { url: new URL('https://example.test/?tenant=preview') }
    await globalThis.indexTemplateLoader(request)
    assert.equal(globalThis.indexTemplateRequests.length, 2)
    assert.ok(globalThis.indexTemplateRequests.every(item => item.request === request))
    assert.equal(globalThis.indexTemplateRequests[1].meaning, 'home')
})
