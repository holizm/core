import tokenize from './tokenize.js'

export default text => {
    if (!text) {
        return ''
    }
    const tokens = tokenize(text)
    const kebabCased = tokens
        .map(token => token.toLowerCase())
        .join('-')
    return kebabCased
}
