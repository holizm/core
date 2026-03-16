#!/usr/bin/env node
import { execSync } from 'child_process'

const home = process.env.HOME

export default (search = '') => {
    let term = search.toLowerCase()
    term = term.endsWith('/') ? term.slice(0, -1) : term;
    const command = `find "${home}" -maxdepth 2 -type d -name ".git"`
    const result = execSync(command, { encoding: 'utf8' }).trim()

    if (!result) return []

    const lines = result.split('\n')
    const dirs = lines.map(line => {
        const repo = line.replace(/\/\.git$/, '')
        return repo
    })

    return dirs.filter(dir => {
        const base = dir.split('/').pop().toLowerCase()
        return term ? base.includes(term) : true
    })
}
