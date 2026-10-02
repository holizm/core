export default id => {
    const cleanId = id.split('?')[0].replaceAll('\\', '/')
    if (!/(?:\/site\/pages\/|\/src\/routes\/|\/theme\d+\/pages\/|\/src\/themes\/[^/]+\/pages\/)/.test(cleanId)) return null
    if (/\/index\.[jt]sx$/.test(cleanId)) return 'page'
    if (/\/layout\.[jt]sx$/.test(cleanId)) return 'layout'
    return null
}
