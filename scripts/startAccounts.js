import {
    divide,
    info,
} from '../scripts/logger.js'
import getDeterministicPort from './getDeterministicPort.js'
import { replaceVariables } from './os.js'
import { runOnTerminal } from './terminal.js'

const createAccountsContainer = params => {
    const {
        composeFile,
        home,
    } = params

    const composeTemplatePath = `${home}/core/container/composes/accounts`
    replaceVariables(composeTemplatePath, composeFile, params)
}

export default params => {
    divide()
    info('Setting up accounts')
    divide()

    params = {
        ...params,
        accountsAdminerDeterministicPort: getDeterministicPort(`${params.containerName}Adminer`),
        accountsDatabaseDeterministicPort: getDeterministicPort(`${params.containerName}Database`),
    }

    const { containerName } = params

    const runningContainer = runOnTerminal(`docker ps -q -f name=${containerName}`)
    if (runningContainer.trim()) {
        runOnTerminal(`Stop ${containerName}`)
    }
    else {
        const exitedContainer = runOnTerminal(
            `docker ps -aq -f status=exited -f name=${containerName}`,
        )

        if (exitedContainer.trim()) {
            runOnTerminal(`docker rm ${containerName}`)
        }
    }

    createAccountsContainer(params)
}
