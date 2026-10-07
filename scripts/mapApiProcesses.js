import {
    readdirSync,
    writeFileSync,
} from 'fs'
import isControlProcess from './isControlProcess.js'

export default params => {
    const {
        containerHome,
        home,
        process,
        repo,
    } = params
    const repositories = [...new Set([repo, repo.replace(/Control$/, '')])]
    const processes = repositories.flatMap(repository => readdirSync(`${home}/${repository}`, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && (entry.name.endsWith('Api') || isControlProcess({
            process: entry.name,
            repo: repository,
        }) && entry.name === 'api'))
        .map(entry => {
            const controlProcess = isControlProcess({
                process: entry.name,
                repo: repository,
            })
            const apiProcess = {
                process: entry.name,
                repo: repository,
                role: controlProcess
                ?
                'control'
                :
                entry.name === 'siteApi'
                    ?
                    ''
                    :
                    entry.name.slice(0, -3),
            }
            return apiProcess
        }))
        .sort((first, second) => first.process.localeCompare(second.process))
    const file = `/tmp/${repo}/${process}/apiProcesses.json`
    writeFileSync(file, `${JSON.stringify(processes, null, 4)}\n`)
    params.addVolume(file, `${containerHome}/${repo}/${process}/apiProcesses.json`)
}
