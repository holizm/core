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
    isEtl,
    isFile,
    removeAndRecreateDir,
    replaceVariables,
    writeFileIfNotExists,
} from './os.js'
import { runOnTerminal } from './terminal.js'
import getDependencies from './getDependencies.js'
import mapLocalizations from './mapLocalizations.js'
import mapNode from './mapNode.js'

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

const mapConfigs = params => {
    let {
        commonPath,
        connectionStringsPath,
        privateSettingsPath,
        publicSettingsPath,
        settingsOverridePath,
        home,
        process,
        repo,
    } = params
    const items = [
        [connectionStringsPath, 'connectionStrings.json'],
        [privateSettingsPath, 'privateSettings.json'],
        [publicSettingsPath, 'publicSettings.json'],
        [settingsOverridePath, 'settingsOverride.json'],
    ]
    for (const [sourcePath, filename] of items) {
        if (isFile(sourcePath))
            params.addVolume(`${commonPath}/${filename}`, `/${repo}/${process}/${filename}`)
    }
    const commonFile = `${home}/secrets/common.json`
    const repoFile = `${home}/secrets/${repo}.json`
    writeFileIfNotExists(commonFile, '{}')
    writeFileIfNotExists(repoFile, '{}')
    params.addVolume(commonFile, `/${repo}/${process}/common.json`)
    params.addVolume(repoFile, `/${repo}/${process}/repo.json`)
}

const mapDependencies = params => {
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
        if (fs.existsSync(`${home}/${repo}/${dependency} `) && dependency !== 'accounts') {
            dependencyOrgOrRep = `/${repo} `
            runnablePart = true
        }

        const dependencyBase = `${home}${dependencyOrgOrRep}/${dependency}/api`
        const partFilePath = `${home}${dependencyOrgOrRep}/${dependency}/part`
        if (!fs.existsSync(partFilePath)) continue

        params.addVolume(`${dependencyBase} `, `/spl/${dependency}`)
        params.addVolume(`${dependencyBase} `, `/${dependency}/api`)
        params.addVolume(`${partFilePath}`, `/${dependency}/part`)


        params.addVolume(`${partFilePath}`, `${nodeModules}/${dependency}/part`)
        params.addVolume(`${dependencyBase}/business`, `${nodeModules}/${dependency}/business`)

        const basename = path.basename(processPath)
        if (basename.startsWith("admin")) {
            params.addVolume(`${dependencyBase}/api/admin`, `${nodeModules}/${dependency}/api/role`)
        }
        if (basename.includes("site")) {
            params.addVolume(`${dependencyBase}/api/site`, `${nodeModules}/${dependency}/api/role`)
        }

        if (runnablePart && fs.existsSync(`/${org}/${process}/api/api/common`)) {
            params.addVolume(`${dependencyBase}/api/common`, `${nodeModules}/${dependency}/api/common`)
        }
        if (fs.existsSync(`${dependencyBase}/api/common`)) {
            params.addVolume(`${dependencyBase}/api/common`, `${nodeModules}/${dependency}/api/common`)
        }

        const baseName = path.basename(process)

    }
}

const mapRunnable = params => {
    let {
        commonPath,
        home,
        process,
        repo,
    } = params
    const dirs = runOnTerminal(`find ${home}/${repo}/${process}/ -mindepth 1 -type d 2>/dev/null`).split('\n')
    const links = runOnTerminal(`find ${home}/${repo}/${process}/ -mindepth 1 -type l 2>/dev/null`).split('\n')
    for (const item of [...dirs, ...links]) if (item) params.addVolume(`${item}`, `${item}`)
    if (fs.existsSync(`${commonPath}/api`))
        params.addVolume(`${commonPath}/api`, `/${repo}/${process}/commonApi`)
    const etlPath = path.join(`${home}/${repo}/etl`)
    if (fs.existsSync(etlPath)) {
        for (const child of fs.readdirSync(etlPath)) {
            const childPath = path.join(etlPath, child)
            if (fs.statSync(childPath).isDirectory())
                params.addVolume(`${childPath}`, `/toMongo/runnableImporters/${child}`)
        }
    }
}

const mapRunnableMigrations = params => {
    let { commonPath } = params
    if (fs.existsSync(`${commonPath}/migration`))
        params.addVolume(`${commonPath}/migration`, `/migration/runnable`)
}

const mapCore = params => {
    let {
        home,
        process,
        repo,
    } = params
    params.addVolume(`${home}/api`, `/api`)
    params.addVolume(`${home}/${repo}/${process}/process.js`, `/${repo}/${process}/process.js`)
}

const createApiContainer = params => {
    const {
        composeFile,
        home,
    } = params
    const composeTemplatePath = `${home}/core/container/composes/api`
    replaceVariables(composeTemplatePath, composeFile, params)
}

export default params => {
    const {
        repo,
    } = params
    if (isEtl(params)) info('Setting up ETL')
    else info('Setting up API')
    divide()
    createNonExistingFiles(params)
    linkVsCodeFiles(params)

    params.processType = 'api'
    mapConfigs(params)
    mapDependencies(params)
    mapLocalizations(params)
    mapRunnable(params)
    mapRunnableMigrations(params)
    mapCore(params)
    mapNode(params)
    params.joinVolumes()

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
