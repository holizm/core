import fs from 'fs'
import path from 'path'
import {
    divide,
    info,
} from '../logger.js'
import { createGitHubAction } from './createGitHubAction.js'
import { createDatabaseContainer } from './createDatabaseContainer.js'
import {
    copyFileIfNotExists,
    createFileIfNotExists,
    getFileContent,
    isDir,
    isEtl,
    replaceEnvs,
    writeFile,
    writeFileIfNotExists,
} from "./os.js"
import { runOnTerminal } from "./terminal.js"

const createNonExistingFiles = params => {
    const {
        commonPath,
        connectionStringsPath,
        dependenciesPath,
        initialPath,
        settingsPath,
    } = params

    writeFileIfNotExists('app.js', 'import { start } from "core"\n\nstart()')

    if (!isDir(commonPath)) {
        fs.mkdirSync(commonPath, { recursive: true })
    }

    createFileIfNotExists(dependenciesPath)
    writeFileIfNotExists(connectionStringsPath, '{}')
    copyFileIfNotExists(`${home}/core/api/initialTemplate`, initialPath)
    copyFileIfNotExists(`${home}/core/api/settingsTemplate`, settingsPath)
}

const linkVSCodeFiles = params => {
    const {
        proc,
        repo,
    } = params
    const vsCodePath = `/tmp/${repo}/${proc}/.vscode`

    if (fs.existsSync(vsCodePath)) fs.rmSync(vsCodePath, { recursive: true })

    fs.mkdirSync(vsCodePath, { recursive: true })
    replaceEnvs(`${home}/core/api/launch`, `${vsCodePath}/launch.json`)
}

const buildConfigMappings = params => {
    const {
        connectionStringsPath,
        privateSettingsPath,
        proc,
        publicSettingsPath,
        repo,
        settingsOverridePath,
    } = params
    let volumes = ''

    if (fs.existsSync(connectionStringsPath))
        volumes += `\n            - /${repo}/common/connectionStrings.json:/${repo}/${proc}/connectionStrings.json`
    if (fs.existsSync(privateSettingsPath))
        volumes += `\n            - /${repo}/common/privateSettings.json:/${repo}/${proc}/privateSettings.json`
    if (fs.existsSync(publicSettingsPath))
        volumes += `\n            - /${repo}/common/publicSettings.json:/${repo}/${proc}/publicSettings.json`
    if (fs.existsSync(settingsOverridePath))
        volumes += `\n            - /${repo}/${proc}/settingsOverride.json:/${repo}/${proc}/settingsOverride.json`

    return volumes
}

const buildDependenciesMappings = params => {
    const {
        dependenciesPath,
        home,
        org,
        proc,
        repo,
    } = params
    let volumes = ''
    const knownDirectoryPatterns = ['*Api', '*Panel', 'common', 'site*', '.*', '*Etl']

    const output = runOnTerminal(`(cat "${dependenciesPath}"; echo; (find /${repo} -mindepth 1 -maxdepth 1 -type d | cut -d'/' -f3 | sort)) | sort | uniq`)
    const dependencies = output.split('\n')

    for (const dependency of dependencies) {
        if (!dependency.trim()) continue
        if (knownDirectoryPatterns.some(pattern => dependency.startsWith(pattern.replace('*', '')))) continue

        let runnablePart = false
        let dependencyOrgOrRep = 'gesht'
        if (fs.existsSync(`${home}/${repo}/${dependency}`) && dependency !== 'accounts') {
            dependencyOrgOrRep = repo
            runnablePart = true
        }

        const dependencyBase = `${home}/${dependencyOrgOrRep}/${dependency}/api`
        const partFilePath = `${home}/${dependencyOrgOrRep}/${dependency}/part`
        if (!fs.existsSync(partFilePath)) continue

        volumes += `\n            - ${dependencyBase}:${dependencyBase}`
        volumes += `\n            - ${partFilePath}:${partFilePath}`
        volumes += `\n            - ${partFilePath}:/npm/node_modules/${dependency}/part`
        volumes += `\n            - ${dependencyBase}/business:/npm/node_modules/${dependency}/business`

        const baseName = path.basename(process.cwd())
        if (baseName.includes('admin'))
            volumes += `\n            - ${dependencyBase}/api/admin:/npm/node_modules/${dependency}/api/role`
        if (baseName.includes('site'))
            volumes += `\n            - ${dependencyBase}/api/site:/npm/node_modules/${dependency}/api/role`

        if (runnablePart && fs.existsSync(`/${org}/${proc}/api/api/common`))
            volumes += `\n            - ${dependencyBase}/api/common:/npm/node_modules/${dependency}/api/common`
        if (fs.existsSync(`${dependencyBase}/api/common`))
            volumes += `\n            - ${dependencyBase}/api/common:/npm/node_modules/${dependency}/api/common`
    }

    return volumes
}

const buildLocalizationMappings = params => {
    const {
        dependenciesPath,
        repo,
    } = params
    let volumes = ''
    const findCommand = `find ${home}/core /${repo} -type d -name localization 2>/dev/null | grep -Ff ${dependenciesPath} -e 'api' | sort`
    const items = runOnTerminal(findCommand).split('\n')
    for (const item of items) if (item.trim()) volumes += `\n            - ${item}:${item}`
    return volumes
}

const buildRunnableApiMappings = params => {
    const {
        repo,
        proc,
    } = params
    let volumes = ''
    const dirs = runOnTerminal(`find /${repo}/${proc}/ -mindepth 1 -type d -not -name '*controllers*' 2>/dev/null`).split('\n')
    const links = runOnTerminal(`find /${repo}/${proc}/ -mindepth 1 -type l 2>/dev/null`).split('\n')
    for (const item of [...dirs, ...links]) if (item.trim()) volumes += `\n            - ${item}:${item}`
    if (fs.existsSync(`/${repo}/common/api`))
        volumes += `\n            - /${repo}/common/api:/${repo}/${proc}/commonApi`
    const etlPath = path.join(`/${repo}/etl`)
    if (fs.existsSync(etlPath)) {
        for (const child of fs.readdirSync(etlPath)) {
            const childPath = path.join(etlPath, child)
            if (fs.statSync(childPath).isDirectory())
                volumes += `\n            - ${childPath}:${home}/gesth/toMongo/runnableImporters/${child}`
        }
    }
    return volumes
}

const buildRunnableMigrationMappings = params => {
    const {
        repo,
    } = params
    let volumes = ''
    if (fs.existsSync(`/${repo}/common/migration`))
        volumes += `\n            - /${repo}/common/migration:${home}/gesth/migration/runnable`
    return volumes
}

const buildCoreMappings = params => {
    const {
        repo,
        proc,
    } = params
    let volumes = ''
    volumes += `\n            - ${home}/core/api:${home}/core/api`
    volumes += `\n            - ${home}/core/api/package.json:/${repo}/${proc}/package.json`
    volumes += `\n            - ${home}/core/api/package-lock.json:/${repo}/${proc}/package-lock.json`
    for (const corePart of ['api', 'application', 'cloud', 'core', 'data', 'extensions', 'validation', 'settings'])
        volumes += `\n            - ${home}/core/api/core/${corePart}:/npm/node_modules/core/${corePart}`
    volumes += `\n            - /${repo}/${proc}/app.js:/${repo}/${proc}/app.js`
    return volumes
}

const buildLocalSecrets = params => {
    const {
        repo,
    } = params
    if (!isFile(`${home}/secrets`)) fs.mkdirSync(`${home}/secrets`)
    const secretFile = `${home}/secrets/${repo}.json`
    if (!isFile(secretFile)) fs.writeFileSync(secretFile, '{}')
}

const buildEnvironmentVariables = params => {
    const envFile = `${home}/secrets/${directory}.json`
    if (!isFile(envFile)) return ''
    try {
        JSON.parse(getFileContent(envFile))
    } catch (e) {
        console.error(`Error: Invalid JSON in ${envFile}`)
        return ''
    }
    const flattened = runOnTerminal(`node ${home}/scripts/flatten.js ${envFile}`)
    return flattened
        .split('\n')
        .filter(Boolean)
        .map(line => `\n            - ${line}`)
        .join('')
}

const createApiContainer = params => {
    const {
        composeFile,
        environmentVariables,
        volumes,
    } = params
    const composeTemplatePath = `${home}/core/container/composes/api`
    let content = getFileContent(composeTemplatePath)
    content = content.replace(/\$HOME/g, home)
    content = content.replace('# - dependenciesPlaceholder', volumes)
    content = content.replace('# - environmentVariablesPlaceholder', environmentVariables)
    writeFile(composeFile, content)
}

export default (params) => {
    const {
    } = params
    if (isEtl(params)) info('Setting up ETL')
    else info('Setting up API')
    divide()
    createNonExistingFiles()
    linkVSCodeFiles()

    let volumes = ''
    volumes += buildConfigMappings()
    volumes += buildDependenciesMappings()
    volumes += buildLocalizationMappings()
    volumes += buildRunnableApiMappings()
    volumes += buildRunnableMigrationMappings()
    volumes += buildCoreMappings()

    buildLocalSecrets()

    let environmentVariables = ''
    environmentVariables += buildEnvironmentVariables('common')
    environmentVariables += buildEnvironmentVariables(process.env.Repository || '')

    if (process.env.ETL !== 'true') createGitHubAction('api')

    const containerName = `${process.env.Repository || ''}Databases`
    const result = runOnTerminal(`docker ps -q -f name=${containerName}`)
    if (!result.trim()) {
        const resultExited = runOnTerminal(`docker ps -aq -f status=exited -f name=${containerName}`)
        if (resultExited.trim()) runOnTerminal(`docker rm ${containerName}`)
        createDatabaseContainer()
    }

    createApiContainer(volumes, environmentVariables)
}
