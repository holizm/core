import { runOnTerminal } from './terminal.js'

export default params => {
    const {
        processType,
        repo,
    } = params
    const directoryPaths = [
        `/tmp/${repo}`,
        `/var/tmp/${processType}`,
        `/var/tmp/${repo}`,
    ]

    for (const directoryPath of directoryPaths) {
        runOnTerminal(`
            if [ -d '${directoryPath}' ]; then
                sudo find '${directoryPath}' -user root -exec chown -h dev:dev {} +
            fi
        `)
    }
}
