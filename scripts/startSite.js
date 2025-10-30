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
    const dependencies = getDependencies()
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

        const pagesPath = path.join(dependencyBase, 'pages')
        if (fs.existsSync(pagesPath)) {
            const mappings = []
            fs.readdirSync(pagesPath).forEach(root => {
                if (!fs.statSync(root).isDirectory()) return
                const pageDirectory = root.split('pages/')[1] || ''
                if (!pageDirectory.trim()) return
                const targetPath = `${processPath}/pages/${pageDirectory}`
                if (!fs.existsSync(targetPath) || fs.readdirSync(targetPath).length === 0) {
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

        const pluginFile = path.join(dependencyBase, 'pages/plugin.ts')
        if (fs.existsSync(pluginFile)) {
            volumes += `\n${indentation}- ${dependencyBase}/pages/Plugin.ts:/${repo}/${process}/src/routes/plugin@${lowercaseDependency}.ts`
        }

        ['parts', 'Contexts', 'Loaders', 'Getters', 'Functions'].forEach(part => {
            const partPath = path.join(dependencyBase, part)
            if (fs.existsSync(partPath) && fs.readdirSync(partPath).length > 0) {
                volumes += `\n${indentation}- ${dependencyBase}/${part}:/${repo}/${process}/src/Modules/${dependency}/${part}`
            }
        })

        const exportsFile = path.join(dependencyBase, 'Exports.jsx')
        if (fs.existsSync(exportsFile) && fs.statSync(exportsFile).size > 0) {
            volumes += `\n${indentation}- ${dependencyBase}/Exports.jsx:/${repo}/${process}/src/Modules/${dependency}/Exports.jsx`
        }
    }

    return volumes
}

const buildPagesDirectoryMappings = params => {
    let volumes = ''
    const repo = process.env.Repository
    const process = process.env.Process
    const processPath = process.env.ProcessPath

    const files = execSync(`find ${processPath}/pages -mindepth 1 -maxdepth 1 -type f`).toString().splitlines()
    files.forEach(path => {
        const fileName = path.basename(path)
        volumes += `\n${indentation}- ${path}:/${repo}/${process}/src/routes/${fileName}`
    })

    const dirs = execSync(`find ${processPath}/pages -mindepth 1 -maxdepth 1 -type d`).toString().splitlines()
    dirs.forEach(path => {
        if (path.trim()) {
            const fileName = path.basename(path)
            volumes += `\n${indentation}- ${path}:/${repo}/${process}/src/routes/${fileName}`
        }
    })

    return volumes
}

const buildPartsDirectoryMappings = params => {
    let volumes = ''
    const repo = process.env.Repository
    const process = process.env.Process
    const processPath = process.env.ProcessPath

    const dirs = execSync(`find ${processPath}/parts -mindepth 1 -type d`).toString().splitlines()
    dirs.forEach(path => {
        const name = path.basename(path)
        volumes += `\n${indentation}- ${path}:/${repo}/${process}/src/parts/${name}`
    })

    return volumes
}

const buildOtherMappings = params => {
    let volumes = ''
    const repo = process.env.Repository
    const process = process.env.Process
    const processPath = process.env.ProcessPath

    ['Getters', 'Functions', 'Loaders'].forEach(part => {
        const dirPath = path.join(processPath, part)
        if (fs.existsSync(dirPath)) {
            volumes += `\n${indentation}- ${processPath}/${part}:/${repo}/${process}/src/${part}`
        }
    })

    return volumes
}

const ensureLocalSecrets = params => {
    const repo = process.env.Repository
    const secretsPath = `/LocalSecrets/${repo}.json`
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

    let volumes = ''
    volumes += buildDependenciesMappings({
        ...params,
        volumes,
    })
    info(volumes)
    exit()
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

    ensureLocalSecrets()

    execSync('sudo rm -rf /HolismHolding/Site/public/Settings.json')
    execSync('sudo rm -rf /HolismHolding/Site/public/SettingsOverride.json')

    const settingsPath = process.env.SettingsPath
    const publicSettingsPath = process.env.PublicSettingsPath
    const privateSettingsPath = process.env.PrivateSettingsPath
    const settingsOverridePath = process.env.SettingsOverridePath
    const tenantsPath = process.env.TenantsPath
    const repo = process.env.Repository
    const process = process.env.Process
    const composeFile = process.env.ComposeFile

    if (settingsPath && fs.existsSync(settingsPath)) {
        volumes += `\n${indentation}- ${settingsPath}:/${repo}/${process}/public/Settings.json`
    }
    if (privateSettingsPath && fs.existsSync(privateSettingsPath)) {
        volumes += `\n${indentation}- ${privateSettingsPath}:/${repo}/${process}/PrivateSettings.json`
    }
    if (publicSettingsPath && fs.existsSync(publicSettingsPath)) {
        volumes += `\n${indentation}- ${publicSettingsPath}:/${repo}/${process}/PublicSettings.json`
    }

    let cacheMappings = `\n${indentation}- /HolismHolding/Site/src/routes/clear-cache:/${repo}/${process}/src/routes/clear-cache`

    if (settingsOverridePath && fs.existsSync(settingsOverridePath)) {
        volumes += `\n${indentation}- ${settingsOverridePath}:/${repo}/${process}/public/SettingsOverride.json`
        try {
            const data = JSON.parse(fs.readFileSync(settingsOverridePath, 'utf-8'))
            if (data.NodeApi === true) {
                cacheMappings = `\n${indentation}- /HolismHolding/Site/src/routes/new-clear-cache:/${repo}/${process}/src/routes/clear-cache`
                cacheMappings += `\n${indentation}- /HolismHolding/Site/src/routes/show-cache:/${repo}/${process}/src/routes/show-cache`
            }
        } catch (err) { }
    }
    volumes += cacheMappings

    if (tenantsPath && fs.existsSync(tenantsPath)) {
        volumes += `\n${indentation}- ${tenantsPath}:/${repo}/${process}/Tenants`
    }

    const composeTemplatePath = '/HolismHolding/Docker/Composes/Site'
    let content = getFileContent(composeTemplatePath)
    content = content.replace('# - DependenciesPlaceholder', volumes)

    writeFile(composeFile, content)
}
