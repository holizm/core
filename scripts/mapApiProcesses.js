import {
    readdirSync,
    writeFileSync,
} from 'fs'

export default params => {
    const {
        containerHome,
        home,
        process,
        repo,
    } = params
    const processes = readdirSync(`${home}/${repo}`, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && entry.name.endsWith('Api'))
        .map(entry => ({
            process: entry.name,
            role: entry.name === 'siteApi'
                ?
                ''
                :
                entry.name.slice(0, -3),
        }))
        .sort((first, second) => first.process.localeCompare(second.process))
    const file = `/tmp/${repo}/${process}/apiProcesses.json`
    writeFileSync(file, `${JSON.stringify(processes, null, 4)}\n`)
    params.addVolume(file, `${containerHome}/${repo}/${process}/apiProcesses.json`)
}
