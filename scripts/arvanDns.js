import { promises as dns } from 'dns'
import fs from 'fs'
import path from 'path'

const secretsDirectory = '/home/dev/secrets'
const apiBaseUrl = 'https://napi.arvancloud.ir/cdn/4.0'

const normalizeDomain = domain => domain.trim().replace(/\.$/, '').toLowerCase()

const request = async (path, apiKey, options = {}) => {
    const response = await fetch(`${apiBaseUrl}${path}`, {
        ...options,
        headers: {
            Authorization: `apikey ${apiKey}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        const body = await response.text()
        throw new Error(`Arvan API error ${response.status}: ${body}`)
    }

    if (response.status === 204) return null

    return response.json()
}

export const getApiKey = domain => {
    const normalizedDomain = normalizeDomain(domain)
    let secrets
    let secretsPath

    for (const file of fs.readdirSync(secretsDirectory)) {
        if (!file.endsWith('.json')) continue

        const filePath = path.join(secretsDirectory, file)

        try {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'))
            const matches = content.ssh?.domains?.some(item => {
                const configuredDomain = normalizeDomain(item)
                return normalizedDomain === configuredDomain || normalizedDomain.endsWith(`.${configuredDomain}`)
            })

            if (!matches) continue
            secrets = content
            secretsPath = filePath
            break
        } catch {}
    }

    if (!secrets) {
        throw new Error(`No secrets file found containing domain: ${domain}`)
    }

    const apiKey = secrets.arvan?.apiKey

    if (!apiKey) {
        throw new Error(`Missing arvan.apiKey in ${secretsPath}`)
    }

    return apiKey
}

const getDomains = async apiKey => {
    const domains = []
    let page = 1
    let lastPage = 1

    do {
        const response = await request(`/domains?page=${page}`, apiKey)
        const items = response.data || response.domains || response

        if (!Array.isArray(items)) {
            throw new Error('Unexpected Arvan domains response')
        }

        for (const item of items) {
            const domain = typeof item === 'string' ? item : item.domain || item.name
            if (domain) domains.push(normalizeDomain(domain))
        }

        lastPage = Number(response.meta?.last_page) || page
        page += 1
    } while (page <= lastPage)

    return domains
}

export const resolveZone = async (domain, apiKey) => {
    const normalizedDomain = normalizeDomain(domain)
    const domains = await getDomains(apiKey)
    const zone = domains
        .filter(item => normalizedDomain === item || normalizedDomain.endsWith(`.${item}`))
        .sort((a, b) => b.length - a.length)[0]

    if (!zone) {
        throw new Error(`No Arvan DNS zone found for ${domain}`)
    }

    return zone
}

export const getRecordName = (domain, zone) => {
    const challenge = `_acme-challenge.${normalizeDomain(domain)}`
    const suffix = `.${normalizeDomain(zone)}`

    return challenge.endsWith(suffix) ? challenge.slice(0, -suffix.length) : challenge
}

export const getTxtRecords = async (zone, apiKey) => {
    const response = await request(`/domains/${zone}/dns-records`, apiKey)
    const records = response.data || response.records || response

    if (!Array.isArray(records)) {
        throw new Error('Unexpected Arvan DNS records response')
    }

    return records.filter(record => String(record.type).toLowerCase() === 'txt')
}

export const checkArvanConnection = async domain => {
    const apiKey = getApiKey(domain)
    const zone = await resolveZone(domain, apiKey)
    await getTxtRecords(zone, apiKey)
}

const getRecordValue = record => {
    if (typeof record.value === 'string') return record.value
    if (typeof record.value?.text === 'string') return record.value.text
    if (typeof record.content === 'string') return record.content
    return ''
}

const getRelativeRecordName = (name, zone) => {
    const normalizedName = normalizeDomain(String(name))
    const suffix = `.${normalizeDomain(zone)}`
    return normalizedName.endsWith(suffix) ? normalizedName.slice(0, -suffix.length) : normalizedName
}

export const createTxtRecord = async (zone, name, value, apiKey) => {
    const records = await getTxtRecords(zone, apiKey)
    const exists = records.some(record =>
        getRelativeRecordName(record.name, zone) === name.toLowerCase() &&
        getRecordValue(record) === value
    )

    if (exists) return false

    await request(`/domains/${zone}/dns-records`, apiKey, {
        method: 'POST',
        body: JSON.stringify({
            type: 'txt',
            name,
            value: { text: value },
        }),
    })

    return true
}

export const deleteTxtRecord = async (zone, name, value, apiKey) => {
    const records = await getTxtRecords(zone, apiKey)
    const matches = records.filter(record =>
        getRelativeRecordName(record.name, zone) === name.toLowerCase() &&
        getRecordValue(record) === value
    )

    for (const record of matches) {
        if (!record.id) throw new Error(`Arvan TXT record has no id: ${name}`)
        await request(`/domains/${zone}/dns-records/${record.id}`, apiKey, { method: 'DELETE' })
    }

    return matches.length
}

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

export const waitForTxtRecord = async (domain, value) => {
    dns.setServers(['1.1.1.1', '8.8.8.8'])
    const challenge = `_acme-challenge.${normalizeDomain(domain)}`
    const deadline = Date.now() + 120000

    while (Date.now() < deadline) {
        try {
            const records = await dns.resolveTxt(challenge)
            if (records.some(parts => parts.join('') === value)) return
        } catch (error) {
            if (!['ENODATA', 'ENOTFOUND'].includes(error.code)) throw error
        }

        await wait(5000)
    }

    throw new Error(`TXT record did not propagate within 120 seconds: ${challenge}`)
}
