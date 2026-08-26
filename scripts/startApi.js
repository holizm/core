import fs from 'fs'
import path from 'path'
import {
    divide,
    info,
} from '../scripts/logger.js'
import createCiCd from './createCiCd.js'
import createDatabaseContainer from './createDatabaseContainer.js'
import createDirectories from './createDirectories.js'
import createSearchDatabaseContainer from './createSearchDatabaseContainer.js'
import getDependencies from './getDependencies.js'
import mapLocalizations from './mapLocalizations.js'
import mapNode from './mapNode.js'
import mapRunnableSearchableProperties from './mapRunnableSearchableProperties.js'
import mapSettings from './mapSettings.js'
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
import removeRootOwnedDirectories from './removeRootOwnedDirectories.js'
import { runOnTerminal } from './terminal.js'

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

    writeFileIfNotExists('process.js', `import { start } from 'core'\n\nstart()`)
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

const mapDependencies = params => {
    const {
        containerHome,
        home,
        nodeModules,
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

        const dependencyRoot = `${home}${dependencyOrgOrRep}/${dependency}`
        const dependencyBase = `${dependencyRoot}/api`
        const partFilePath = `${dependencyRoot}/part`
        if (!fs.existsSync(partFilePath)) {
            continue
        }

        params.addVolume(`${dependencyBase}`, `${containerHome}/spl/${dependency}`)
        params.addVolume(`${dependencyBase}`, `${containerHome}/${dependency}/api`)
        params.addVolume(`${partFilePath}`, `${containerHome}/${dependency}/part`)

        if (runnablePart) {
            const localizationDirectories = [
                'localization',
                'panel/localization',
                'site/localization',
            ]
            for (const directory of localizationDirectories) {
                const source = `${dependencyRoot}/${directory}`
                if (fs.existsSync(source)) {
                    params.addVolume(source, `${containerHome}/${dependency}/${directory}`)
                }
            }
        }

        params.addVolume(`${partFilePath}`, `${nodeModules}/${dependency}/part`)
        params.addVolume(`${dependencyBase}/business`, `${nodeModules}/${dependency}/business`)

        const basename = path.basename(processPath)
        if (basename.startsWith('admin')) {
            params.addVolume(`${dependencyBase}/api/admin`, `${nodeModules}/${dependency}/api/role`)
        }
        if (basename.includes('site')) {
            params.addVolume(`${dependencyBase}/api/site`, `${nodeModules}/${dependency}/api/role`)
        }

        if (runnablePart && fs.existsSync(`/${org}/${process}/api/api/common`)) {
            params.addVolume(`${dependencyBase}/api/common`, `${nodeModules}/${dependency}/api/common`)
        }
        if (fs.existsSync(`${dependencyBase}/api/common`)) {
            params.addVolume(`${dependencyBase}/api/common`, `${nodeModules}/${dependency}/api/common`)
        }
    }
}

const mapRunnable = params => {
    const {
        commonPath,
        containerHome,
        home,
        process,
        repo,
    } = params
    const dirs = runOnTerminal(`find ${home}/${repo}/${process}/ -mindepth 1 -type d 2>/dev/null`).split('\n')
    const links = runOnTerminal(`find ${home}/${repo}/${process}/ -mindepth 1 -type l 2>/dev/null`).split('\n')
    for (const item of [...dirs, ...links]) {
        if (item) {
            params.addVolume(`${item}`, `${item}`)
        }
    }
    if (fs.existsSync(`${commonPath}/api`)) {
        params.addVolume(`${commonPath}/api`, `${containerHome}/${repo}/${process}/commonApi`)
    }
    const etlPath = path.join(`${home}/${repo}/etl`)
    if (fs.existsSync(etlPath)) {
        for (const child of fs.readdirSync(etlPath)) {
            const childPath = path.join(etlPath, child)
            if (fs.statSync(childPath).isDirectory()) {
                params.addVolume(`${childPath}`, `${containerHome}/toMongo/runnableImporters/${child}`)
            }
        }
    }
}

const mapRunnableMigrations = params => {
    const {
        commonPath,
        containerHome,
    } = params
    if (fs.existsSync(`${commonPath}/migration`)) {
        params.addVolume(`${commonPath}/migration`, `${containerHome}/migration/runnable`)
    }
}

const mapCore = params => {
    const {
        containerHome,
        home,
        nodeModules,
        process,
        repo,
    } = params
    const coreItems = [
        'ai',
        'api',
        'application',
        'cloud',
        'core',
        'data',
        'extensions',
        'settings',
        'validation',
    ]
    for (const coreItem of coreItems) {
        params.addVolume(`${home}/api/core/${coreItem}`, `${nodeModules}/core/${coreItem}`)
    }
    params.addVolume(`${home}/api`, `${containerHome}/api`)
    params.addVolume(`${home}/${repo}/${process}/process.js`, `${containerHome}/${repo}/${process}/process.js`)
}

const createDatabases = params => {
    const { repo } = params
    const databaseContainerName = `${repo}Databases`
    const runningDatabaseContainer = runOnTerminal(`docker ps -q -f name=${databaseContainerName}`)
    if (!runningDatabaseContainer.trim()) {
        const exitedDatabaseContainer = runOnTerminal(`docker ps -aq -f status=exited -f name=${databaseContainerName}`)
        if (exitedDatabaseContainer.trim()) {
            runOnTerminal(`docker rm ${databaseContainerName}`)
        }
        createDatabaseContainer(params)
    }

    const searchDatabaseContainerName = `${repo}SearchDatabases`
    const runningSearchDatabaseContainer = runOnTerminal(`docker ps -q -f name=${searchDatabaseContainerName}`)
    if (!runningSearchDatabaseContainer.trim()) {
        const exitedSearchDatabaseContainer = runOnTerminal(`docker ps -aq -f status=exited -f name=${databaseContainerName}`)
        if (exitedSearchDatabaseContainer.trim()) {
            runOnTerminal(`docker rm ${searchDatabaseContainerName}`)
        }
        createSearchDatabaseContainer(params)
    }
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
        containerHome,
        localBuild,
    } = params
    if (isEtl(params)) {
        info('Setting up ETL')
        params.isEtl = true
    }
    else {
        info('Setting up API')
    }
    divide()
    params.processType = 'api'
    createNonExistingFiles(params)

    createDirectories({
        ...params,
        extraDirectories: [
            [`/tmp/generation`, `${containerHome}/generation`],
            [`/tmp/migration`, `${containerHome}/migration`],
            [`/tmp/query`, `${containerHome}/query`],
            [`/tmp/toMongo`, `${containerHome}/toMongo`],
        ],
    })
    removeRootOwnedDirectories(params)
    linkVsCodeFiles(params)
    mapNode(params)
    mapSettings(params)
    mapRunnableSearchableProperties(params)
    mapDependencies(params)
    mapLocalizations(params)
    mapRunnable(params)
    mapRunnableMigrations(params)
    mapCore(params)
    params.joinVolumes()

    if (!isEtl(params)) {
        createCiCd(params)
    }

    if (!localBuild) {
        createDatabases(params)
    }
    createApiContainer(params)
}
