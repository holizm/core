#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'

const CORE_HOOKS_DIR = path.resolve('./hooks')
const GLOBAL_GIT_HOOKS_DIR = path.join(os.homedir(), '.git-templates', 'hooks')
fs.mkdirSync(GLOBAL_GIT_HOOKS_DIR, { recursive: true })

fs.readdirSync(CORE_HOOKS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .forEach(hookType => {
        const hookTypeName = hookType.name
        const hookScriptsDir = path.join(CORE_HOOKS_DIR, hookTypeName)
        const globalHookPath = path.join(GLOBAL_GIT_HOOKS_DIR, hookTypeName)
        const scripts = fs.readdirSync(hookScriptsDir).filter(f => f.endsWith('.js'))
        const runnerContent = `#!/usr/bin/env node
import { execSync } from 'child_process'
import { join } from 'path'
const scripts = ${JSON.stringify(scripts)}
for (const script of scripts) {
  console.log('Running', script)
  execSync('node ' + join('${hookScriptsDir}', script), { stdio: 'inherit' })
}
`
        fs.writeFileSync(globalHookPath, runnerContent, { mode: 0o755 })
        console.log(`Installed ${hookTypeName} hook with ${scripts.length} script(s)`)
    })

execSync(`git config --global init.templateDir "${path.join(os.homedir(), '.git-templates')}"`)
console.log('Global Git hooks setup complete')
