export default (process, isControl) => {
    if (process.startsWith('admin') || process.startsWith('control') || (isControl && ['api', 'panel'].includes(process))) return 'admin'
    if (process.includes('site')) return 'site'
    if (/(?:Api|Panel|App)$/.test(process)) return process.replace(/(?:Api|Panel|App)$/, '')
    return null
}
