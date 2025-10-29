import camelize from './camelize.js'

export default text => {
    const camel = camelize(text)
    if (!camel) return ''
    return camel.charAt(0).toUpperCase() + camel.slice(1)
}
