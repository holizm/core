import fs from 'fs'
import { basename } from "path"
import { runOnTerminal } from './terminal.js'
import createGitHubAction from "./createGitHubAction.js"
import {
    divide,
    error,
    errorAndExit,
    info,
    warning,
} from './logger.js'
import {
    copyFileIfNotExists,
    createDirIfNotExists,
    exit,
    getFileContent,
    getFileLines,
    isDir,
    isFile,
    replaceVariables,
    writeFile,
} from './os.js'
import getDependencies from "./getDependencies.js"

const indentation = ' '.repeat(12)

const createNonExistentFiles = params => {
    const { home } = params
    createDirIfNotExists('pages')
    createDirIfNotExists('parts/layout')
    createDirIfNotExists('parts/shared')
    copyFileIfNotExists(`${home}/core/site/headTemplate.jsx`, 'pages/head.jsx')
    copyFileIfNotExists(`${home}/core/site/layoutTemplate.jsx`, 'pages/layout.jsx')
    copyFileIfNotExists(`${home}/core/site/indexTemplate.jsx`, 'pages/index.jsx')
    copyFileIfNotExists(`${home}/core/site/footerTemplate.jsx`, 'parts/layout/footer.jsx')
    copyFileIfNotExists(`${home}/core/site/paginationTemplate.jsx`, 'parts/shared/pagination.jsx')
    copyFileIfNotExists(`${home}/core/site/breadcrumbTemplate.jsx`, 'parts/shared/breadcrumb.jsx')
    copyFileIfNotExists(`${home}/core/site/richTextTemplate.jsx`, 'parts/shared/richText.jsx')
    copyFileIfNotExists(`${home}/core/site/tailwindTemplate.css`, 'tailwindTemplate.css')
}

const buildDependenciesMappings = params => {
    let {
        home,
        repo,
        org,
        process,
        processPath,
        volumes,
    } = params
    const dependencies = getDependencies(params)
    const instance = `/${repo}/instance`

    for (const dependency of dependencies) {
        let runnablePart = false
        const dependencyPath = `${home}/${repo}/${dependency}`
        let dependencyBase = ""
        if (isDir(dependencyPath) && dependency !== 'accounts') {
            dependencyBase = `${dependencyPath}/site`
        } else if (isFile(instance) && isDir(`/${getFileContent(instance).trim()}/${dependency}`) && dependency !== 'accounts') {
            dependencyBase = `${home}/${getFileContent(instance).trim()}/${dependency}/site`
        } else {
            dependencyBase = `${home}/${dependency}/site`
        }
        const lowercaseDependency = dependency.toLowerCase()
        const pagesPath = `${dependencyBase}/pages`
        if (isDir(pagesPath)) {
            const mappings = []
            fs.readdirSync(pagesPath).forEach(page => {
                const pagePath = `${pagesPath}/${page}`
                console.log(pagePath)
                if (!fs.statSync(pagePath).isDirectory()) return
                const pageDirectory = page.split('pages/')[1] || ''
                if (!pageDirectory.trim()) return
                const targetPath = `${processPath}/pages/${pageDirectory}`
                if (!isFile(targetPath) || fs.readdirSync(targetPath).length === 0) {
                    const source = `${dependencyBase}/pages/${pageDirectory}`
                    const target = `${home}/${repo}/${process}/src/routes/${pageDirectory}`
                    mappings.push([source, target])
                }
            })
            mappings.sort((a, b) => a[1].localeCompare(b[1]))
            mappings.forEach(([source, target]) => {
                volumes += `\n${indentation}- ${source}:${target}`
            })
        }

        const pluginFile = `${dependencyBase}/pages/plugin.ts`
        if (isFile(pluginFile)) {
            volumes += `\n${indentation}- ${dependencyBase}/pages/plugin.ts:/${repo}/${process}/src/routes/plugin@${lowercaseDependency}.ts`
        }

        ['parts', 'contexts', 'loaders', 'getters', 'functions'].forEach(part => {
            const partPath = `${dependencyBase}/${part}`
            if (isFile(partPath) && fs.readdirSync(partPath).length > 0) {
                volumes += `\n${indentation}- ${dependencyBase}/${part}:/${repo}/${process}/src/parts/${dependency}/${part}`
            }
        })

        const exportsFile = `${dependencyBase}/exports.jsx`
        if (isFile(exportsFile) && fs.statSync(exportsFile).size > 0) {
            volumes += `\n${indentation}- ${dependencyBase}/exports.jsx:/${repo}/${process}/src/parts/${dependency}/exports.jsx`
        }
    }

    return volumes
}

const buildPagesDirectoryMappings = params => {
    let {
        repo,
        org,
        home,
        volumes,
        process,
        processPath,
    } = params

    const files = runOnTerminal(`find ${processPath}/pages -mindepth 1 -maxdepth 1 -type f`).split('\n')
    files.forEach(path => {
        const fileName = basename(path)
        volumes += `\n${indentation}- ${path}:/${repo}/${process}/src/routes/${fileName}`
    })

    const dirs = runOnTerminal(`find ${processPath}/pages -mindepth 1 -maxdepth 1 -type d`).split('\n')
    dirs.forEach(path => {
        if (path.trim()) {
            const fileName = basename(path)
            volumes += `\n${indentation}- ${path}:/${repo}/${process}/src/routes/${fileName}`
        }
    })

    return volumes
}

const buildPartsDirectoryMappings = params => {
    let {
        home,
        repo,
        org,
        process,
        processPath,
        volumes,
    } = params

    const dirs = runOnTerminal(`find ${processPath}/parts -mindepth 1 -type d`).split('\n')
    dirs.forEach(path => {
        const name = basename(path)
        volumes += `\n${indentation}- ${path}:/${repo}/${process}/src/parts/${name}`
    })

    return volumes
}

const buildOtherMappings = params => {
    let {
        process,
        processPath,
        repo,
        volumes,
    } = params

    const otherDirs = ['getters', 'functions', 'loaders']
    otherDirs.forEach(part => {
        const dirPath = `${processPath}/${part}`
        if (isDir(dirPath)) {
            volumes += `\n${indentation}- ${processPath}/${part}:/${repo}/${process}/src/${part}`
        }
    })

    return volumes
}

const ensureLocalSecrets = params => {
    const {
        home,
        repo,
    } = params
    const secretsPath = `${home}/secrets/${repo}.json`
    if (!isFile(secretsPath)) {
        writeFile(secretsPath, '{}')
    }
}

export default params => {

    info('Setting up site')
    divide()

    createNonExistentFiles(params)
    createGitHubAction({
        ...params,
        processType: "site",
    })

    let volumes = ''
    volumes += buildDependenciesMappings({
        ...params,
        volumes,
    })
    volumes += buildPagesDirectoryMappings({
        ...params,
        volumes,
    })
    volumes += buildPartsDirectoryMappings({
        ...params,
        volumes,
    })
    volumes += buildOtherMappings({
        ...params,
        volumes,
    })
    ensureLocalSecrets(params)
    const {
        composeFile,
        home,
        privateSettingsPath,
        process,
        publicSettingsPath,
        repo,
        settingsOverridePath,
        tenantsPath,
    } = params
    if (privateSettingsPath && isFile(privateSettingsPath)) {
        volumes += `\n${indentation}- ${privateSettingsPath}:/${repo}/${process}/privateSettings.json`
    }
    if (publicSettingsPath && isFile(publicSettingsPath)) {
        volumes += `\n${indentation}- ${publicSettingsPath}:/${repo}/${process}/publicSettings.json`
    }
    let cacheMappings = `\n${indentation}- ${home}/site/src/routes/clear-cache:/${repo}/${process}/src/routes/clear-cache`

    if (settingsOverridePath && isFile(settingsOverridePath)) {
        volumes += `\n${indentation}- ${settingsOverridePath}:/${repo}/${process}/public/SettingsOverride.json`
    }
    cacheMappings = `\n${indentation}- ${home}/site/src/routes/new-clear-cache:/${repo}/${process}/src/routes/clear-cache`
    cacheMappings += `\n${indentation}- ${home}/site/src/routes/show-cache:/${repo}/${process}/src/routes/show-cache`
    volumes += cacheMappings
    if (tenantsPath && isFile(tenantsPath)) {
        volumes += `\n${indentation}- ${tenantsPath}:/${repo}/${process}/tenants`
    }
    params.dependenciesPlaceholder = volumes
    const composeTemplatePath = `${home}/core/container/composes/site`
    replaceVariables(composeTemplatePath, composeFile, params)
}
