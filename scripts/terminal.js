#!/usr/bin/env node

import {
    exec,
    execSync,
    spawn
} from 'child_process'
import { promisify } from 'util'
import { error, info } from './logger.js'

const execAsync = promisify(exec)

export const clear = () => {
    process.stdout.write('\x1Bc')
}

export const runOnTerminal = (command, throwOnError, hideError) => {
    try {
        const result = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
        return result.trim()
    } catch (e) {
        const msg = e.stderr?.toString().trim() || e.message || String(e)
        if (!hideError) {
            error(msg)
        }
        if (throwOnError) throw msg
        return ''
    }
}

export const runOnTerminalAsync = async (command, opts = {}) => {
    const {
        throwOnError = false,
        cwd = process.cwd(),
        env = process.env,
        timeoutMs,
        maxBuffer = 1024 * 1024 * 20
    } = opts

    try {
        const { stdout, stderr } = await execAsync(command, {
            cwd,
            env,
            timeout: timeoutMs,
            maxBuffer,
            shell: true
        })
        const out = `${stdout || ''}${stderr || ''}`.trim()
        return out
    } catch (e) {
        const msg = (e.stderr || e.stdout || e.message || String(e)).trim()
        error(msg)
        if (throwOnError) throw msg
        return ''
    }
}

export const runStreaming = (command) => new Promise((resolve, reject) => {
    const child = spawn(command, { shell: true, stdio: 'inherit' })
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`exit ${code}`)))
})
