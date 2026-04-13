import { isFile } from './os.js'

export default params => {
    let {
        domain,
        process,
        siteFilePath,
    } = params
    domain = domain.trim()
    const parts = domain.split('.')
    if (parts.length > 1) {
        parts[parts.length - 1] = 'local'
    } else {
        parts.push('local')
    }
    const baseDomain = parts.join('.')
    let clean = process
    const affixes = ['Site', 'Panel', 'Api', 'Databases', 'New']
    for (const affix of affixes) {
        const regex = new RegExp(`^${affix}|${affix}$`, 'i')
        clean = clean.replace(regex, '')
    }
    if (isFile(siteFilePath)) clean = ''
    clean = clean.trim().toLowerCase()
    const subdomains = []

    if (process.endsWith('Api')) subdomains.push('api')
    if (process.startsWith('New') || process.endsWith('New')) subdomains.push('new')
    if (clean) subdomains.push(clean)

    const subdomainPrefix = subdomains.join('.')

    return subdomainPrefix
        ?
        `${subdomainPrefix}.${baseDomain}`
        :
        baseDomain
}
