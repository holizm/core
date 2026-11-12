import {
    divide,
    info,
} from '../scripts/logger.js'
import createRunnableCompass from './createRunnableCompass.js'
import getDeterministicPort from './getDeterministicPort.js'
import {
    createDirIfNotExists,
    getContent,
    overrideFile,
} from './os.js'
import prepareComposeFile from './prepareComposeFile.js'
import { runOnTerminalAsync } from './terminal.js'

const createDatabaseComposeFile = params => {
    const {
        composeTemplatePath,
        repo,
    } = params
    const composePath = `/tmp/${repo}/databases/compose.yaml`
    const content = getContent(composeTemplatePath)
    const substitutedContent = content.replace(/\$\{(\w+)\}/g, (_, name) => params[name] || '')
    overrideFile(composePath, substitutedContent)
    return composePath
}

const createMongoDatabaseContainer = async params => {
    const {
        home,
        lowercaseRepo,
        repo,
    } = params
    const repositorySettings = JSON.parse(getContent(`${home}/secrets/${repo}.json`))
    const sharedSettings = JSON.parse(getContent(`${home}/secrets/privateCommon.json`))
    const database = repositorySettings.database || sharedSettings.database
    info('Creating database container')
    const composePath = createDatabaseComposeFile({
        ...params,
        composeTemplatePath: `${home}/core/container/composes/database`,
        databasePassword: database.password,
        databaseUser: database.user,
    })
    prepareComposeFile(composePath)
    await runOnTerminalAsync(`docker compose -p ${lowercaseRepo}-databases -f ${composePath} up -d --remove-orphans`, {
        throwOnError: true,
    })
}

export default async params => {
    const {
        isCiCd,
        repo,
    } = params
    if (isCiCd) {
        return
    }
    createDirIfNotExists(`/var/tmp/${repo}/databases/data`)
    createDirIfNotExists(`/var/tmp/${repo}/databases/replicaKey`)
    params.databaseEnginePort = getDeterministicPort(repo)

    divide()
    await createMongoDatabaseContainer(params)
    await createRunnableCompass(params)
    divide()
}
