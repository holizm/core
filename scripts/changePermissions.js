import { runOnTerminal } from './terminal.js'

export default params => {
    const {
        repo,
        processType,
    } = params
    const dirs = [
        `/tmp/${repo}`,
        `/var/tmp/${processType}`,
        `/var/tmp/${repo}`,
    ]

    dirs.forEach(dir => {
        runOnTerminal(`
            if [ -d "${dir}" ]; then
                sudo find "${dir}" -user root -exec chown -h dev:dev {} +
            fi
        `)
    })
}
