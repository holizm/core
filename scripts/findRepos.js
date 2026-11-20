import { runOnTerminal } from './terminal.js'

const home = process.env.HOME

export default (search = '') => {
    let term = search.toLowerCase()
    term = term.endsWith('/') ? term.slice(0, -1) : term
    const command = `find ${home} -mindepth 2 -maxdepth 2 -type d -name .git 2>/dev/null`
    const result = runOnTerminal(command).trim()

    if (!result) return []

    const lines = result.split('\n')
    const dirs = lines
        .filter(line => line.endsWith('/.git'))
        .map(line => line.replace(/\/\.git$/, ''))

    return dirs.filter(dir => {
        const base = dir.split('/').pop().toLowerCase()
        return term ? base.includes(term) : true
    })
}
