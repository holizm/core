#!/usr/bin/env node

import {
    deleteTxtRecord,
    getApiKey,
    getRecordName,
    resolveZone,
} from './arvanDns.js'
import {
    error,
    info,
    success,
} from './logger.js'

const domain = process.env.CERTBOT_DOMAIN
const validation = process.env.CERTBOT_VALIDATION

try {
    if (!domain || !validation) {
        throw new Error('CERTBOT_DOMAIN and CERTBOT_VALIDATION are required')
    }

    const apiKey = getApiKey(domain)
    const zone = await resolveZone(domain, apiKey)
    const recordName = getRecordName(domain, zone)

    info(`Removing DNS challenge for ${domain}`)
    await deleteTxtRecord(zone, recordName, validation, apiKey)
    success(`DNS challenge removed for ${domain}`)
} catch (exception) {
    error(exception)
    process.exitCode = 1
}
