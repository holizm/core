#!/usr/bin/env node

import { execSync, spawnSync } from "child_process"
import { error } from "../scripts/logger.js"

export const clear = () => {
    process.stdout.write("\x1Bc")
}

export const runOnTerminal = (command, throwOnError) => {
    const useShell = />|\||&/.test(command)
    try {
        if (useShell) {
            const result = execSync(command, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] })
            return result.trim()
        } else {
            const parts = command.trim().split(/\s+/)
            const result = spawnSync(parts[0], parts.slice(1), { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] })
            if (result.status !== 0) throw new Error(result.stderr || result.error)
            return result.stdout.trim()
        }
    } catch (e) {
        const msg = e.stderr?.toString().trim() || e.message || String(e)
        error(msg)
        if (throwOnError) throw msg
        return ""
    }
}
