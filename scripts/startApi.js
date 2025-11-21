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
    writeFile,
    writeFileIfNotExists,
} from "./os.js"
import { runOnTerminal } from "./terminal.js"
import getDependencies from "./getDependencies.js"
import buildLocalizationMappings from "./buildLocalizationMappings.js"

const indentation = ' '.repeat(12)

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

    writeFileIfNotExists('app.js', 'import { start } from \'core\'\n\nstart()')
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
        volumes,
    } = params
    if (fs.existsSync(connectionStringsPath))
        volumes += `\n${indentation}- ${home}/${repo}/common/connectionStrings.json:/${repo}/${process}/connectionStrings.json`
    if (fs.existsSync(privateSettingsPath))
        volumes += `\n${indentation}- ${home}/${repo}/common/privateSettings.json:/${repo}/${process}/privateSettings.json`
    if (fs.existsSync(publicSettingsPath))
        volumes += `\n${indentation}- ${home}/${repo}/common/publicSettings.json:/${repo}/${process}/publicSettings.json`
    if (fs.existsSync(settingsOverridePath))
        volumes += `\n${indentation}- ${home}/${repo}/common/settingsOverride.json:/${repo}/${process}/settingsOverride.json`
    return volumes
}

const buildDependenciesMappings = params => {
    let {
        home,
        org,
        process,
        repo,
        volumes,
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

        volumes += `\n${indentation}- ${dependencyBase}:/${dependency}/api`
        volumes += `\n${indentation}- ${partFilePath}:/${dependency}/part`
        volumes += `\n${indentation}- ${partFilePath}:/root/.npm/node_modules/${dependency}/part`
        volumes += `\n${indentation}- ${dependencyBase}/business:/root/.npm/node_modules/${dependency}/api/business`

        const baseName = path.basename(process)
        if (baseName.includes('admin'))
            volumes += `\n${indentation}- ${dependencyBase}/api/admin:/root/.npm/node_modules/${dependency}/api/api/role`
        if (baseName.includes('site'))
            volumes += `\n${indentation}- ${dependencyBase}/api/site:/root/.npm/node_modules/${dependency}/api/api/role`

        if (runnablePart && fs.existsSync(`/${org}/${process}/api/api/common`))
            volumes += `\n${indentation}- ${dependencyBase}/api/common:/root/.npm/node_modules/${dependency}/api/common`
        if (fs.existsSync(`${dependencyBase}/api/common`))
            volumes += `\n${indentation}- ${dependencyBase}/api/common:/root/.npm/node_modules/${dependency}/api/common`
    }

    return volumes
}

const buildRunnableApiMappings = params => {
    let {
        home,
        process,
        repo,
        volumes,
    } = params
    const dirs = runOnTerminal(`find ${home}/${repo}/${process}/ -mindepth 1 -type d 2>/dev/null`).split('\n')
    const links = runOnTerminal(`find ${home}/${repo}/${process}/ -mindepth 1 -type l 2>/dev/null`).split('\n')
    for (const item of [...dirs, ...links]) if (item) volumes += `\n${indentation}- ${item}:${item}`
    if (fs.existsSync(`${home}/${repo}/common/api`))
        volumes += `\n${indentation}- ${home}/${repo}/common/api:/${repo}/${process}/commonApi`
    const etlPath = path.join(`${home}/${repo}/etl`)
    if (fs.existsSync(etlPath)) {
        for (const child of fs.readdirSync(etlPath)) {
            const childPath = path.join(etlPath, child)
            if (fs.statSync(childPath).isDirectory())
                volumes += `\n${indentation}- ${childPath}:/toMongo/runnableImporters/${child}`
        }
    }
    return volumes
}

const buildRunnableMigrationMappings = params => {
    let {
        home,
        repo,
        volumes,
    } = params
    if (fs.existsSync(`${home}/${repo}/common/migration`))
        volumes += `\n${indentation}- ${home}/${repo}/common/migration:/migration/runnable`
    return volumes
}

const buildCoreMappings = params => {
    let {
        home,
        process,
        repo,
        volumes,
    } = params
    volumes += `\n${indentation}- ${home}/api:/api`
    volumes += `\n${indentation}- ${home}/api/package.json:/${repo}/${process}/package.json`
    volumes += `\n${indentation}- ${home}/api/package-lock.json:/${repo}/${process}/package-lock.json`
    for (const corePart of [
        'api',
        'application',
        'cloud',
        'core',
        'data',
        'extensions',
        'validation',
        'settings'
    ])
        volumes += `\n${indentation}- ${home}/api/${corePart}:/root/.npm/node_modules/core/${corePart}`
    volumes += `\n${indentation}- ${home}/${repo}/${process}/app.js:/${repo}/${process}/app.js`
    return volumes
}

const buildSecrets = params => {
    let {
        home,
        process,
        repo,
        volumes,
    } = params
    if (!isDir(`${home}/secrets`)) fs.mkdirSync(`${home}/secrets`)
    const commonFile = `${home}/secrets/common.json`
    if (!isFile(commonFile)) fs.writeFileSync(commonFile, '{}')
    const secretFile = `${home}/secrets/${repo}.json`
    if (!isFile(secretFile)) fs.writeFileSync(secretFile, '{}')

    volumes += `\n${indentation}- ${commonFile}:/${repo}/${process}/common.json`
    volumes += `\n${indentation}- ${secretFile}:/${repo}/${process}/repo.json`
    return volumes
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
        home,
        repo,
    } = params
    if (isEtl(params)) info('setting up ETL')
    else info('setting up API')
    divide()
    createNonExistingFiles(params)
    linkVsCodeFiles(params)

    let volumes = ''
    volumes += buildConfigMappings({
        ...params,
        volumes,
    })
    volumes += buildDependenciesMappings({
        ...params,
        volumes,
    })
    volumes += buildLocalizationMappings({
        ...params,
        volumes,
    })
    volumes += buildRunnableApiMappings({
        ...params,
        volumes,
    })
    volumes += buildRunnableMigrationMappings({
        ...params,
        volumes,
    })
    volumes += buildCoreMappings({
        ...params,
        volumes,
    })
    volumes += buildSecrets({
        ...params,
        volumes,
    })
    params.volumes = volumes

    if (!isEtl(params)) {
        createGitHubAction({
            ...params,
            processType: 'api',
        })
    }

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
