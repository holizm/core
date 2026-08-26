#!/usr/bin/env node

import {
    exec,
    execSync,
    spawn,
} from 'child_process'
import { promisify } from 'util'
import {
    error,
    errorAndExit,
    getStack,
} from './logger.js'

const execAsync = promisify(exec)

export const clear = () => process.stdout.write('\x1Bc')

export const runOnTerminal = (command, params) => {
    if (!command) {
        errorAndExit(`Command is empty`, getStack())
    }
    const {
        hideErrors = false,
        show = false,
        splitLines = false,
        throwOnError = false,
    } = params || {}
    const trimmed = command.trim()

    let stdout = ''
    let stderr = ''

    try {
        const buffer = execSync(trimmed, {
            encoding: 'buffer',
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true,
        })

        stdout = buffer.toString()

        if (show) {
            process.stdout.write(stdout)
        }

    } catch (e) {
        if (e.stdout) {
            stdout = e.stdout.toString()
        }
        if (e.stderr) {
            stderr = e.stderr.toString()
        }

        if (show) {
            if (stdout) {
                process.stdout.write(stdout)
            }
            if (stderr && !hideErrors) {
                process.stderr.write(stderr)
            }
        }

        const msg = (stderr || e.message || String(e)).trim()
        if (!hideErrors && show) {
            error(msg)
        }
        if (throwOnError) {
            throw new Error(msg)
        }
    }
    const result = `${stdout}${stderr}`.trim()
    if (splitLines) {
        return result.split('\n')
    }

    return result
}

export const runOnTerminalAsync = async (command, opts = {}) => {
    const {
        cwd = process.cwd(),
        env = process.env,
        maxBuffer = 1024 * 1024 * 20,
        throwOnError = false,
        timeoutMs,
    } = opts

    try {
        const {
            stderr,
            stdout,
        } = await execAsync(command.trim(), {
            cwd,
            env,
            maxBuffer,
            shell: true,
            timeout: timeoutMs,
        })
        return `${stdout || ''}${stderr || ''}`.trim()
    } catch (e) {
        const msg = (e.stderr || e.stdout || e.message || String(e)).trim()
        error(msg)
        if (throwOnError) {
            throw msg
        }
        return ''
    }
}

export const runStreaming = command => new Promise((resolve, reject) => {
    const child = spawn(command.trim(), { shell: true, stdio: 'inherit' })
    child.on('close', code =>
        code === 0
        ?
        resolve()
        :
        reject(new Error(`exit ${code}`))
    )
})
