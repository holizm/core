import { runOnTerminal } from './terminal.js'

export default params => {
    const {
        processType,
    } = params

    const basePath = `/var/tmp/${processType}/nodeModules`

    const command = `find ${basePath} -mindepth 1 -maxdepth 1 -type d -user root -exec rm -rf {} +`
    return runOnTerminal(command)
}
