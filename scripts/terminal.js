#!/usr/bin/env node

import { execSync } from 'child_process'
import { error } from './logger.js'

export const clear = () => {
    process.stdout.write('\x1Bc')
}

export const runOnTerminal = (command, throwOnError) => {
    try {
        const result = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
        return result.trim()
    } catch (e) {
        const msg = e.stderr?.toString().trim() || e.message || String(e)
        error(msg)
        if (throwOnError) throw msg
        return ''
    }
}
