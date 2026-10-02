import assert from 'assert/strict'
import { readFileSync } from 'fs'
import { test } from 'node:test'
import componentMetadataVite from './componentMetadataVite.js'

const transform = componentMetadataVite().transform

test('adds part and component to a site part root', () => {
    const source = "export default ({ amount, rate }) => <span class='amount'>{amount * rate / 100}</span>"
    const result = transform(source, '/home/dev/taxation/site/parts/taxAmount.jsx').code
    assert.match(result, /<span[^>]*component="taxAmount"[^>]*part="taxation"/)
    assert.doesNotMatch(result, /type="/)
})

test('adds type to a nested part root and preserves native button type', () => {
    const path = '/home/dev/blog/site/parts/post/actionButton.jsx'
    const result = transform("export default () => <button type='button' />", path).code
    assert.match(result, /type='button'/)
    assert.match(result, /data-type="post"/)
})

test('handles a Qwik component and a panel identifier export', () => {
    const qwik = transform("import { component$ } from '@builder.io/qwik'; export default component$(() => <section />)", '/home/dev/blog/site/parts/post/card.jsx').code
    const panel = transform('const Card = props => <div />; export default Card', '/home/dev/blog/panel/admin/post/card.jsx').code
    assert.match(qwik, /<section[^>]*part="blog"/)
    assert.match(panel, /<div[^>]*type="post"/)
})

test('resolves composed container paths', () => {
    const site = transform('export default () => <span />', '/home/dev/holismThemes/site/src/parts/blog/parts/post/card.jsx').code
    const panel = transform('export default () => <div />', '/home/dev/taskOs/adminPanel/src/blog/panel/admin/post/card.jsx').code
    assert.match(site, /<span[^>]*part="blog"[^>]*type="post"/)
    assert.match(panel, /<div[^>]*part="blog"[^>]*type="post"/)
})

test('tags site and panel core components', () => {
    const site = transform('export default props => <div />', '/home/dev/site/pageParts/container.jsx').code
    const mappedSite = transform('export default props => <span />', '/home/dev/holismThemes/site/src/coreParts/chip.jsx').code
    const panel = transform('export default props => <div />', '/home/dev/complexPanel/src/components/chip.jsx').code
    const mappedPanel = transform('export default props => <span />', '/home/dev/taskOs/adminPanel/src/components/chip.jsx').code
    assert.match(site, /component="container"[^>]*part="core"/)
    assert.match(mappedSite, /component="chip"[^>]*part="core"/)
    assert.match(panel, /component="chip"[^>]*part="core"/)
    assert.match(mappedPanel, /component="chip"[^>]*part="core"/)
})

test('does not tag child components', () => {
    const part = transform('export default props => <><div /><Card /></>', '/home/dev/blog/site/parts/post/cards.jsx').code
    assert.match(part, /<div[^>]*part="blog"/)
    assert.match(part, /<Card \/>/)
})

test('forwards a composed component name through the core container', () => {
    const carouselPath = '/home/dev/site/pageParts/card/cardsCarousel.jsx'
    const containerPath = '/home/dev/site/pageParts/container.jsx'
    const carousel = transform(readFileSync(carouselPath, 'utf8'), carouselPath).code
    const container = transform(readFileSync(containerPath, 'utf8'), containerPath).code
    assert.match(carousel, /<Container[^>]*component="cardsCarousel"[^>]*part="core"/)
    assert.match(container, /<div\s+component="container"\s+part="core"\s+\{\.\.\.rest\}/)
})

test('adds page and layout classes to native site route roots', () => {
    const page = transform("export default () => <main class='about' />", '/home/dev/jzpThemes/site/src/routes/about/index.jsx').code
    const layout = transform("export default () => <div class='themeRoot' />", '/home/dev/jzpThemes/site/src/themes/01/pages/layout.jsx').code
    assert.match(page, /<main class="about page"/)
    assert.match(layout, /<div class="themeRoot layout"/)
})

test('keeps route fragments and component roots unchanged', () => {
    const fragment = transform('export default () => <><div /><Content /></>', '/home/dev/jzpThemes/site/src/routes/index.jsx').code
    const component = transform('export default () => <Page />', '/home/dev/jzpThemes/site/src/routes/about/index.jsx').code
    assert.doesNotMatch(fragment, /class="page"/)
    assert.doesNotMatch(component, /class="page"/)
})
