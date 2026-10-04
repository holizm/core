import fs from 'fs'
import path from 'path'
import isFile from './isFile.js'

export default params => {
    const {
        domain,
        process,
        processPath,
        siteFilePath,
    } = params
    const parts = domain.trim().split('.')
    if (parts.length > 1) {
        parts[parts.length - 1] = 'local'
    }
    else {
        parts.push('local')
    }

    const baseDomain = parts.join('.')
    let processName = process
    const affixes = [
        'Api',
        'Databases',
        'Panel',
        'Site',
    ]
    let previousProcessName
    do {
        previousProcessName = processName
        for (const affix of affixes) {
            const regex = new RegExp(`^${affix}|${affix}$`, 'i')
            processName = processName.replace(regex, '')
        }
    } while (processName !== previousProcessName)
    if (isFile(siteFilePath)) {
        processName = ''
    }
    const subdomainFile = processPath && path.join(processPath, 'subdomain')
    if (isFile(subdomainFile)) {
        processName = fs.readFileSync(subdomainFile, 'utf8').trim()
    }
    processName = processName.trim().toLowerCase()

    const subdomains = []

    if (process.endsWith('Api')) {
        subdomains.push('api')
    }
    if (processName) {
        subdomains.push(processName)
    }

    const subdomainPrefix = subdomains.join('.')
    const host =
        subdomainPrefix
        ?
        `${subdomainPrefix}.${baseDomain}`
        :
        baseDomain

    return host
}
