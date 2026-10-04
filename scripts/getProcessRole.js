export default process => {
    if (process.startsWith('admin') || process.startsWith('control')) return 'admin'
    if (process.includes('site')) return 'site'
    if (/(?:Api|Panel|App)$/.test(process)) return process.replace(/(?:Api|Panel|App)$/, '')
    return null
}
