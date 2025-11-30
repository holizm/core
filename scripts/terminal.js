#!/usr/bin/env node

import {
    exec,
    execSync,
    spawn,
} from 'child_process'
import { Writable } from 'stream'
import { promisify } from 'util'
import { error } from './logger.js'

const execAsync = promisify(exec)

export const clear = () => process.stdout.write('\x1Bc')

export const runOnTerminal = (command, { throwOnError = false, hideError = false, show = true } = {}) => {
    const trimmed = command.trim()

    const captured = { stdout: '', stderr: '' }

    const stdout = new Writable({
        write(chunk, _, cb) {
            captured.stdout += chunk.toString()
            if (show) process.stdout.write(chunk)
            cb()
        }
    })

    const stderr = new Writable({
        write(chunk, _, cb) {
            captured.stderr += chunk.toString()
            if (show && !hideError) process.stderr.write(chunk)
            cb()
        }
    })

    let result
    try {
        result = execSync(trimmed, {
            shell: true,
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            encoding: 'buffer'   // important: we handle raw buffers
        })
        captured.stdout += result.toString()   // fallback if any buffered data
    } catch (e) {
        if (e.stdout) captured.stdout += e.stdout.toString()
        if (e.stderr) captured.stderr += e.stderr.toString()

        const errMsg = captured.stderr || e.message || String(e)
        if (!hideError && show) error(errMsg.trim())
        if (throwOnError) throw new Error(errMsg.trim())
    }

    return (captured.stdout + captured.stderr).trim()
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
        const { stdout, stderr } = await execAsync(command.trim(), {
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

export const runStreaming = command => new Promise((resolve, reject) => {
    const child = spawn(command.trim(), { shell: true, stdio: 'inherit' })
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`exit ${code}`)))
})
