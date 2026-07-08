import {
    divide,
} from '../scripts/logger.js'
import getRandomPort from './getRandomPort.js'
import {
    replaceVariables,
} from './os.js'
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

    getRandomPort('accountsDatabaseRandomPort', params)
    getRandomPort('accountsAdminerRandomPort', params)

    const { repo } = params
    const containerName = `${repo}Accounts`

    const result = runOnTerminal(`docker ps -q -f name=${containerName}`)
    if (result.trim()) {
        runOnTerminal(`Stop ${containerName}`)
    }
    else {
        const resultExited = runOnTerminal(
            `docker ps -aq -f status=exited -f name=${containerName}`
        )

        if (resultExited.trim())
            runOnTerminal(`docker rm ${containerName}`)
    }

    createAccountsContainer(params)
}
