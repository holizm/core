#!/usr/bin/env node

import {
    createTxtRecord,
    getApiKey,
    getRecordName,
    resolveZone,
    waitForTxtRecord,
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

    info(`Creating DNS challenge for ${domain}`)
    await createTxtRecord(zone, recordName, validation, apiKey)
    await waitForTxtRecord(domain, validation)
    success(`DNS challenge is ready for ${domain}`)
} catch (exception) {
    error(exception)
    process.exitCode = 1
}
