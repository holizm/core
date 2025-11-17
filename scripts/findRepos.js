#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const HOME = process.env.HOME

export default (search = '') => {
    search = search.toLowerCase()
    const items = fs.readdirSync(HOME, { withFileTypes: true })
    const gitDirs = []

    for (const item of items) {
        if (!item.isDirectory()) continue
        if (!/^[a-zA-Z0-9]+$/.test(item.name)) continue

        if (search && !item.name.toLowerCase().includes(search)) continue

        const gitPath = path.join(HOME, item.name, '.git')
        if (fs.existsSync(gitPath) && fs.lstatSync(gitPath).isDirectory()) {
            gitDirs.push(path.join(HOME, item.name))
        }
    }

    return gitDirs
}
