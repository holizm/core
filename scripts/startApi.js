import fs from 'fs'
import path from 'path'
import {
    divide,
    info,
} from '../scripts/logger.js'
import createGitHubAction from './createGitHubAction.js'
import createDatabaseContainer from './createDatabaseContainer.js'
import {
    copyFileIfNotExists,
    createDirIfNotExists,
    createFileIfNotExists,
    getFileContent,
    isDir,
    isEtl,
    isFile,
    removeAndRecreateDir,
    replaceVariables,
    writeFileIfNotExists,
} from './os.js'
import { runOnTerminal } from './terminal.js'
import getDependencies from './getDependencies.js'
import buildLocalizationMappings from './buildLocalizationMappings.js'
import buildPackageMapping from './buildPackageMapping.js'
import indentation from './indentation.js'

const createNonExistingFiles = params => {
    const {
        commonPath,
        connectionStringsPath,
        dependenciesPath,
        home,
        initialPath,
        privateSettingsPath,
        publicSettingsPath,
    } = params

    writeFileIfNotExists('process.js', 'import { start } from \'core\'\n\nstart()')
    createDirIfNotExists(commonPath)
    createFileIfNotExists(dependenciesPath)
    writeFileIfNotExists(connectionStringsPath, '{}')
    copyFileIfNotExists(`${home}/core/api/initialTemplate`, initialPath)
    copyFileIfNotExists(`${home}/core/api/privateSettingsTemplate`, privateSettingsPath)
    copyFileIfNotExists(`${home}/core/api/publicSettingsTemplate`, publicSettingsPath)
}

const linkVsCodeFiles = params => {
    const {
        home,
        process,
        repo,
    } = params
    const vsCodePath = `/tmp/${repo}/${process}/.vscode`
    removeAndRecreateDir(vsCodePath)
    replaceVariables(`${home}/core/api/launch`, `${vsCodePath}/launch.json`, params)
}

const buildConfigMappings = params => {
    let {
        connectionStringsPath,
        home,
        privateSettingsPath,
        process,
        publicSettingsPath,
        repo,
        settingsOverridePath,
    } = params
    if (fs.existsSync(connectionStringsPath))
        params.volumes += `\n${indentation}- ${home}/${repo}/common/connectionStrings.json:/${repo}/${process}/connectionStrings.json`
    if (fs.existsSync(privateSettingsPath))
        params.volumes += `\n${indentation}- ${home}/${repo}/common/privateSettings.json:/${repo}/${process}/privateSettings.json`
    if (fs.existsSync(publicSettingsPath))
        params.volumes += `\n${indentation}- ${home}/${repo}/common/publicSettings.json:/${repo}/${process}/publicSettings.json`
    if (fs.existsSync(settingsOverridePath))
        params.volumes += `\n${indentation}- ${home}/${repo}/common/settingsOverride.json:/${repo}/${process}/settingsOverride.json`
}

const buildDependenciesMappings = params => {
    let {
        home,
        org,
        process,
        processPath,
        repo,
    } = params

    const dependencies = getDependencies(params)
    for (const dependency of dependencies) {
        let runnablePart = false
        let dependencyOrgOrRep = ''
        if (fs.existsSync(`${home}/${repo}/${dependency}`) && dependency !== 'accounts') {
            dependencyOrgOrRep = `/${repo}`
            runnablePart = true
        }

        const dependencyBase = `${home}${dependencyOrgOrRep}/${dependency}/api`
        const partFilePath = `${home}${dependencyOrgOrRep}/${dependency}/part`
        if (!fs.existsSync(partFilePath)) continue

        params.volumes += `\n${indentation}- ${dependencyBase}:/${dependency}/api`
        params.volumes += `\n${indentation}- ${partFilePath}:/${dependency}/part`


        params.volumes += `\n${indentation}- ${partFilePath}:/root/.npm/node_modules/${dependency}/part`
        params.volumes += `\n${indentation}- ${dependencyBase}/business:/root/.npm/node_modules/${dependency}/business`

        const basename = path.basename(processPath)
        if (basename.startsWith("admin")) {
            params.volumes += `\n${indentation}- ${dependencyBase}/api/admin:/root/.npm/node_modules/${dependency}/api/role`
        }
        if (basename.includes("site")) {
            params.volumes += `\n${indentation}- ${dependencyBase}/api/site:/root/.npm/node_modules/${dependency}/api/role`
        }

        if (runnablePart && fs.existsSync(`/${org}/${process}/api/api/common`)) {
            params.volumes += `\n${indentation}- ${dependencyBase}/api/common:/root/.npm/node_modules/${dependency}/api/common`
        }
        if (fs.existsSync(`${dependencyBase}/api/common`)) {
            params.volumes += `\n${indentation}- ${dependencyBase}/api/common:/root/.npm/node_modules/${dependency}/api/common`
        }

        const baseName = path.basename(process)

    }
}

const buildRunnableApiMappings = params => {
    let {
        home,
        process,
        repo,
    } = params
    const dirs = runOnTerminal(`find ${home}/${repo}/${process}/ -mindepth 1 -type d 2>/dev/null`).split('\n')
    const links = runOnTerminal(`find ${home}/${repo}/${process}/ -mindepth 1 -type l 2>/dev/null`).split('\n')
    for (const item of [...dirs, ...links]) if (item) params.volumes += `\n${indentation}- ${item}:${item}`
    if (fs.existsSync(`${home}/${repo}/common/api`))
        params.volumes += `\n${indentation}- ${home}/${repo}/common/api:/${repo}/${process}/commonApi`
    const etlPath = path.join(`${home}/${repo}/etl`)
    if (fs.existsSync(etlPath)) {
        for (const child of fs.readdirSync(etlPath)) {
            const childPath = path.join(etlPath, child)
            if (fs.statSync(childPath).isDirectory())
                params.volumes += `\n${indentation}- ${childPath}:/toMongo/runnableImporters/${child}`
        }
    }
}

const buildRunnableMigrationMappings = params => {
    let {
        home,
        repo,
    } = params
    if (fs.existsSync(`${home}/${repo}/common/migration`))
        params.volumes += `\n${indentation}- ${home}/${repo}/common/migration:/migration/runnable`
}

const buildCoreMappings = params => {
    let {
        home,
        process,
        repo,
    } = params
    params.volumes += `\n${indentation}- ${home}/api:/api`
    params.volumes += `\n${indentation}- ${home}/${repo}/${process}/process.js:/${repo}/${process}/process.js`
}

const buildSecrets = params => {
    let {
        home,
        process,
        repo,
    } = params
    if (!isDir(`${home}/secrets`)) fs.mkdirSync(`${home}/secrets`)
    const commonFile = `${home}/secrets/common.json`
    if (!isFile(commonFile)) fs.writeFileSync(commonFile, '{}')
    const secretFile = `${home}/secrets/${repo}.json`
    if (!isFile(secretFile)) fs.writeFileSync(secretFile, '{}')

    params.volumes += `\n${indentation}- ${commonFile}:/${repo}/${process}/common.json`
    params.volumes += `\n${indentation}- ${secretFile}:/${repo}/${process}/repo.json`
}

const createApiContainer = params => {
    const {
        composeFile,
        home,
    } = params
    const composeTemplatePath = `${home}/core/container/composes/api`
    replaceVariables(composeTemplatePath, composeFile, params)
}

export default (params) => {
    const {
        repo,
    } = params
    if (isEtl(params)) info('setting up ETL')
    else info('setting up API')
    divide()
    createNonExistingFiles(params)
    linkVsCodeFiles(params)

    params.volumes = ''
    params.processType = 'api'
    buildConfigMappings(params)
    buildDependenciesMappings(params)
    buildLocalizationMappings(params)
    buildRunnableApiMappings(params)
    buildRunnableMigrationMappings(params)
    buildCoreMappings(params)
    buildSecrets(params)
    buildPackageMapping(params)

    if (!isEtl(params)) createGitHubAction(params)

    const containerName = `${repo}Databases`
    const command = `docker ps -q -f name=${containerName}`
    const result = runOnTerminal(command)
    if (!result.trim()) {
        const resultExited = runOnTerminal(`docker ps -aq -f status=exited -f name=${containerName}`)
        if (resultExited.trim()) runOnTerminal(`docker rm ${containerName}`)
        // createDatabaseContainer(params)
    }
    createApiContainer(params)
}
