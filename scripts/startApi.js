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
import getApiUtilityDirectories from './getApiUtilityDirectories.js'
import mapApiUtilities from './mapApiUtilities.js'
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
import { measure } from './timing.js'
import {
    runOnTerminal,
    runOnTerminalAsync,
} from './terminal.js'

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
        dependencies,
        home,
        nodeModules,
        org,
        process,
        processPath,
        repo,
    } = params
    const basename = path.basename(processPath)
    let role
    if (basename.startsWith('admin')) {
        role = 'admin'
    }
    if (basename.includes('site')) {
        role = 'site'
    }

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

        const rolePath = `${dependencyBase}/api/${role}`
        if (role && fs.existsSync(rolePath)) {
            params.addVolume(rolePath, `${nodeModules}/${dependency}/api/role`)
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

const ensureDatabaseContainer = async params => {
    const { repo } = params
    const databaseContainerName = `${repo}Databases`
    const runningDatabaseContainer = await runOnTerminalAsync(`docker ps -q -f name=${databaseContainerName}`)
    if (runningDatabaseContainer.trim()) {
        return
    }
    const exitedDatabaseContainer = await runOnTerminalAsync(`docker ps -aq -f status=exited -f name=${databaseContainerName}`)
    if (exitedDatabaseContainer.trim()) {
        await runOnTerminalAsync(`docker rm ${databaseContainerName}`, {
            throwOnError: true,
        })
    }
    const webServerChanged = await createDatabaseContainer(params)
    params.webServerChanged = webServerChanged || params.webServerChanged
}

const ensureSearchDatabaseContainer = async params => {
    const { repo } = params
    const searchDatabaseContainerName = `${repo}SearchDatabases`
    const runningSearchDatabaseContainer = await runOnTerminalAsync(`docker ps -q -f name=${searchDatabaseContainerName}`)
    if (runningSearchDatabaseContainer.trim()) {
        return
    }
    const exitedSearchDatabaseContainer = await runOnTerminalAsync(`docker ps -aq -f status=exited -f name=${searchDatabaseContainerName}`)
    if (exitedSearchDatabaseContainer.trim()) {
        await runOnTerminalAsync(`docker rm ${searchDatabaseContainerName}`, {
            throwOnError: true,
        })
    }
    const webServerChanged = await createSearchDatabaseContainer(params)
    params.webServerChanged = webServerChanged || params.webServerChanged
}

const registerDatabaseContainerTasks = params => {
    params.addContainerStartupTask('ensure database container', () => ensureDatabaseContainer(params))
    params.addContainerStartupTask('ensure search database container', () => ensureSearchDatabaseContainer(params))
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
    measure('API: create missing files', () => createNonExistingFiles(params))

    measure('API: create directories', () => createDirectories({
        ...params,
        extraDirectories: [
            ...getApiUtilityDirectories(params),
            `/tmp/${params.repo}/migration`,
            `/tmp/${params.repo}/storage`,
        ],
    }))
    measure('API: remove root-owned directories', () => removeRootOwnedDirectories(params))
    measure('API: link VS Code files', () => linkVsCodeFiles(params))
    measure('API: map Node files', () => mapNode(params))
    measure('API: map settings', () => mapSettings(params))
    measure('API: map searchable properties', () => mapRunnableSearchableProperties(params))
    measure('API: map dependencies', () => mapDependencies(params))
    measure('API: map localizations', () => mapLocalizations(params))
    measure('API: map runnable files', () => mapRunnable(params))
    measure('API: map utilities', () => mapApiUtilities(params))
    measure('API: map core', () => mapCore(params))
    measure('API: join volumes', () => params.joinVolumes())

    if (!isEtl(params)) {
        measure('API: create CI/CD', () => createCiCd(params))
    }

    if (!localBuild) {
        measure('API: register database container tasks', () => registerDatabaseContainerTasks(params))
    }
    measure('API: create Compose file', () => createApiContainer(params))
}
