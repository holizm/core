#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'

const HOME = os.homedir()
const CORE_HOOKS_DIR = path.resolve(`${HOME}/core/hooks`)
const GLOBAL_TEMPLATES_DIR = path.join(HOME, '.git-templates')
const GLOBAL_HOOKS_DIR = path.join(GLOBAL_TEMPLATES_DIR, 'hooks')

function ensureGlobalHooksDir() {
    fs.mkdirSync(GLOBAL_HOOKS_DIR, { recursive: true })
}

function buildGlobalHooks() {
    const hookDirs = fs.readdirSync(CORE_HOOKS_DIR, { withFileTypes: true }).filter(d => d.isDirectory())

    for (const dir of hookDirs) {
        const hookType = dir.name
        const hookScriptsDir = path.join(CORE_HOOKS_DIR, hookType)
        const scripts = fs.readdirSync(hookScriptsDir).filter(f => f.endsWith('.js'))
        const runnerPath = path.join(GLOBAL_HOOKS_DIR, hookType)

        const runnerContent = `#!/usr/bin/env node
import { execSync } from 'child_process'
import { join } from 'path'

const scripts = ${JSON.stringify(scripts)}

for (const script of scripts) {
  try {
    execSync('node ' + join('${hookScriptsDir}', script), { stdio: 'inherit' })
  } catch {
    process.exit(1)
  }
}
`
        fs.writeFileSync(runnerPath, runnerContent, { mode: 0o755 })
        console.log(`Installed ${hookType} hook (${scripts.length} script${scripts.length !== 1 ? 's' : ''})`)
    }
}

function configureGitTemplateDir() {
    execSync(`git config --global init.templateDir "${GLOBAL_TEMPLATES_DIR}"`)
    console.log('Global Git template directory configured')
}

function findGitRepos() {
    try {
        const output = execSync(`bash -c "find ~ -type d -name '.git' 2>/dev/null"`, { encoding: 'utf8' })
        return output.split('\n').filter(Boolean).map(p => path.dirname(p))
    } catch {
        return []
    }
}

function linkOrCopyHooks(repoPath) {
    const repoHooksDir = path.join(repoPath, '.git', 'hooks')
    try {
        fs.rmSync(repoHooksDir, { recursive: true, force: true })
        fs.symlinkSync(GLOBAL_HOOKS_DIR, repoHooksDir, 'dir')
        console.log(`✓ Symlinked hooks → ${repoPath}`)
    } catch {
        fs.mkdirSync(repoHooksDir, { recursive: true })
        for (const file of fs.readdirSync(GLOBAL_HOOKS_DIR)) {
            fs.copyFileSync(path.join(GLOBAL_HOOKS_DIR, file), path.join(repoHooksDir, file))
        }
        console.log(`✓ Copied hooks → ${repoPath}`)
    }
}

function applyHooksToExistingRepos() {
    console.log('Searching for existing git repositories...')
    const repos = findGitRepos()
    if (!repos.length) return console.log('No existing repositories found.')
    for (const repo of repos) linkOrCopyHooks(repo)
    console.log(`Updated ${repos.length} repositories.`)
}

function main() {
    ensureGlobalHooksDir()
    buildGlobalHooks()
    configureGitTemplateDir()
    applyHooksToExistingRepos()
    console.log('✅ Global Git hooks setup complete')
}

main()
