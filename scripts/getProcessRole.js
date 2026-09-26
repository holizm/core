export default process => {
    if (process.startsWith('admin') || process.startsWith('control')) return 'admin'
    if (process.includes('site')) return 'site'
    return null
}
