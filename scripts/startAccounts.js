import {
    divide,
} from '../scripts/logger.js'
import getRandomPort from './getRandomPort.js'
import {
    replaceVariables,
} from './os.js'
import { runOnTerminal } from './terminal.js'
import { info } from '../scripts/logger.js'

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
        ...getRandomPort('accountsDatabaseRandomPort'),
        ...getRandomPort('accountsAdminerRandomPort'),
    }

    const { containerName } = params

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
