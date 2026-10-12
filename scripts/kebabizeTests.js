import assert from 'assert/strict'
import test from 'node:test'
import kebabize from './kebabize.js'

test('kebabize converts mixed separators and capitals to URL words', () => {
    assert.equal(kebabize(''), '')
    assert.equal(kebabize('Order Items'), 'order-items')
    assert.equal(kebabize('api_responseCode'), 'api-response-code')
})
