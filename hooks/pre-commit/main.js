#!/usr/bin/env node
// disabled
import { execSync } from 'child_process'

try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD')
        .toString()
        .trim()

    if (branch === 'main') {
        console.error('🚫 Commits to the main branch are not allowed.')
        process.exit(1)
    }

    console.log(`✅ Commit allowed on branch: ${branch}`)
} catch (err) {
    console.error('❌ Failed to determine Git branch.')
    console.error(err)
    process.exit(1)
}
