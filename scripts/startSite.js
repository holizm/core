import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
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
    writeFile,
} from './os.js'

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

const buildDependenciesMpagesings = params => {
    let volumes = ''
    const repository = process.env.Repository
    const process = process.env.Process
    const dependenciesPath = process.env.DependenciesPath
    const processPath = process.env.ProcessPath
    const dependencies = getFileLines(dependenciesPath)
    const instance = `/${repository}/Instance`

    dependencies.forEach(dependency => {
        if (dependency.trim() === '') return

        let dependencyBase
        if (fs.existsSync(`/${repository}/${dependency}`) && dependency !== 'Accounts') {
            dependencyBase = `/${repository}/${dependency}/Site`
        } else if (isFile(instance) && isDir(`/${getFileContent(instance).trim()}/${dependency}`) && dependency !== 'Accounts') {
            dependencyBase = `/${getFileContent(instance).trim()}/${dependency}/Site`
        } else {
            dependencyBase = `/HolismHolding/${dependency}/Site`
        }

        const lowercaseDependency = dependency.toLowerCase()

        const pagesPath = path.join(dependencyBase, 'pages')
        if (fs.existsSync(pagesPath)) {
            const mpagesings = []
            fs.readdirSync(pagesPath).forEach(root => {
                if (!fs.statSync(root).isDirectory()) return
                const pageDirectory = root.split('pages/')[1] || ''
                if (!pageDirectory.trim()) return
                const targetPath = path.join(processPath, 'pages', pageDirectory)
                if (!fs.existsSync(targetPath) || fs.readdirSync(targetPath).length === 0) {
                    const source = path.join(dependencyBase, 'pages', pageDirectory)
                    const target = `/${repository}/${process}/src/routes/${pageDirectory}`
                    mpagesings.push([source, target])
                }
            })
            mpagesings.sort((a, b) => a[1].localeCompare(b[1]))
            mpagesings.forEach(([source, target]) => {
                volumes += `\n            - ${source}:${target}`
            })
        }

        const pluginFile = path.join(dependencyBase, 'pages/Plugin.ts')
        if (fs.existsSync(pluginFile)) {
            volumes += `\n            - ${dependencyBase}/pages/Plugin.ts:/${repository}/${process}/src/routes/plugin@${lowercaseDependency}.ts`
        }

        ['parts', 'Contexts', 'Loaders', 'Getters', 'Functions'].forEach(part => {
            const partPath = path.join(dependencyBase, part)
            if (fs.existsSync(partPath) && fs.readdirSync(partPath).length > 0) {
                volumes += `\n            - ${dependencyBase}/${part}:/${repository}/${process}/src/Modules/${dependency}/${part}`
            }
        })

        const exportsFile = path.join(dependencyBase, 'Exports.jsx')
        if (fs.existsSync(exportsFile) && fs.statSync(exportsFile).size > 0) {
            volumes += `\n            - ${dependencyBase}/Exports.jsx:/${repository}/${process}/src/Modules/${dependency}/Exports.jsx`
        }
    })

    return volumes
}

const buildpagesDirectoryMpagesings = params => {
    let volumes = ''
    const repository = process.env.Repository
    const process = process.env.Process
    const processPath = process.env.ProcessPath

    const files = execSync(`find ${processPath}/pages -mindepth 1 -maxdepth 1 -type f`).toString().splitlines()
    files.forEach(path => {
        const fileName = path.basename(path)
        volumes += `\n            - ${path}:/${repository}/${process}/src/routes/${fileName}`
    })

    const dirs = execSync(`find ${processPath}/pages -mindepth 1 -maxdepth 1 -type d`).toString().splitlines()
    dirs.forEach(path => {
        if (path.trim()) {
            const fileName = path.basename(path)
            volumes += `\n            - ${path}:/${repository}/${process}/src/routes/${fileName}`
        }
    })

    return volumes
}

const buildpartsDirectoryMpagesings = params => {
    let volumes = ''
    const repository = process.env.Repository
    const process = process.env.Process
    const processPath = process.env.ProcessPath

    const dirs = execSync(`find ${processPath}/parts -mindepth 1 -type d`).toString().splitlines()
    dirs.forEach(path => {
        const name = path.basename(path)
        volumes += `\n            - ${path}:/${repository}/${process}/src/parts/${name}`
    })

    return volumes
}

const buildOtherMpagesings = params => {
    let volumes = ''
    const repository = process.env.Repository
    const process = process.env.Process
    const processPath = process.env.ProcessPath

    ['Getters', 'Functions', 'Loaders'].forEach(part => {
        const dirPath = path.join(processPath, part)
        if (fs.existsSync(dirPath)) {
            volumes += `\n            - ${processPath}/${part}:/${repository}/${process}/src/${part}`
        }
    })

    return volumes
}

const ensureLocalSecrets = params => {
    const repository = process.env.Repository
    const secretsPath = `/LocalSecrets/${repository}.json`
    if (!fs.existsSync(secretsPath)) {
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
    exit()

    let volumes = ''
    volumes += buildDependenciesMpagesings()
    volumes += buildpagesDirectoryMpagesings()
    volumes += buildpartsDirectoryMpagesings()
    volumes += buildOtherMpagesings()

    ensureLocalSecrets()

    execSync('sudo rm -rf /HolismHolding/Site/public/Settings.json')
    execSync('sudo rm -rf /HolismHolding/Site/public/SettingsOverride.json')

    const settingsPath = process.env.SettingsPath
    const publicSettingsPath = process.env.PublicSettingsPath
    const privateSettingsPath = process.env.PrivateSettingsPath
    const settingsOverridePath = process.env.SettingsOverridePath
    const tenantsPath = process.env.TenantsPath
    const repository = process.env.Repository
    const process = process.env.Process
    const composeFile = process.env.ComposeFile

    if (settingsPath && fs.existsSync(settingsPath)) {
        volumes += `\n            - ${settingsPath}:/${repository}/${process}/public/Settings.json`
    }
    if (privateSettingsPath && fs.existsSync(privateSettingsPath)) {
        volumes += `\n            - ${privateSettingsPath}:/${repository}/${process}/PrivateSettings.json`
    }
    if (publicSettingsPath && fs.existsSync(publicSettingsPath)) {
        volumes += `\n            - ${publicSettingsPath}:/${repository}/${process}/PublicSettings.json`
    }

    let cacheMpagesing = `\n            - /HolismHolding/Site/src/routes/clear-cache:/${repository}/${process}/src/routes/clear-cache`

    if (settingsOverridePath && fs.existsSync(settingsOverridePath)) {
        volumes += `\n            - ${settingsOverridePath}:/${repository}/${process}/public/SettingsOverride.json`
        try {
            const data = JSON.parse(fs.readFileSync(settingsOverridePath, 'utf-8'))
            if (data.NodeApi === true) {
                cacheMpagesing = `\n            - /HolismHolding/Site/src/routes/new-clear-cache:/${repository}/${process}/src/routes/clear-cache`
                cacheMpagesing += `\n            - /HolismHolding/Site/src/routes/show-cache:/${repository}/${process}/src/routes/show-cache`
            }
        } catch (err) { }
    }
    volumes += cacheMpagesing

    if (tenantsPath && fs.existsSync(tenantsPath)) {
        volumes += `\n            - ${tenantsPath}:/${repository}/${process}/Tenants`
    }

    const composeTemplatePath = '/HolismHolding/Docker/Composes/Site'
    let content = getFileContent(composeTemplatePath)
    content = content.replace('# - DependenciesPlaceholder', volumes)

    writeFile(composeFile, content)
}
