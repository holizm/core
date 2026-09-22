import fs from 'fs'

export default repoPath => fs.readdirSync(repoPath, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && /^theme\d+$/.test(entry.name))
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
