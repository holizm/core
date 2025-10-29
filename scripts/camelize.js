import tokenize from './tokenize.js'

export default text => {
    if (!text) {
        return ''
    }
    const tokens = tokenize(text)
    const camelCased = tokens
        .map((token, index) => {
            if (index === 0) {
                return token.toLowerCase()
            } else {
                return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()
            }
        }).join('')
    return camelCased
}
