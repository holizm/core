import fs from 'fs'
import { basename } from 'path'
import { runOnTerminal } from './terminal.js'
import createCiCd from './createCiCd.js'
import {
    divide,
    info,
} from './logger.js'
import {
    copyFileIfNotExists,
    createDirIfNotExists,
    getFileContent,
    isDir,
    isFile,
    replaceVariables,
    writeFile,
} from './os.js'
import getDependencies from './getDependencies.js'
import mapNode from '../scripts/mapNode.js'
import mapSettings from "./mapSettings.js"
import createDirectories from "./createDirectories.js"

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
    copyFileIfNotExists(`${home}/core/site/tailwindTemplate.css`, 'tailwind.css')
}

const mapDependencies = params => {
    let {
        home,
        repo,
        process,
        processPath,
    } = params
    const dependencies = getDependencies(params)
    const instance = `${home}/${repo}/instance`

    for (const dependency of dependencies) {
        let runnablePart = false
        const dependencyPath = `${home}/${repo}/${dependency}`
        let dependencyBase = ''
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
                /*
                todo`,`
                /route/slug => /route/[slug]
                /route/id => /route/[id]
                /camelizedRoute => /kebabized-route
                */
                if (!fs.statSync(pagePath).isDirectory()) return
                const pageDirectory = page.split('pages/')[0] || ''
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
                params.addVolume(`${source}`, `${target}`)
            })
        }

        const pluginFile = `${dependencyBase}/pages/plugin.ts`
        if (isFile(pluginFile)) {
            params.addVolume(`${dependencyBase}/pages/plugin.ts`, `${home}/${repo}/${process}/src/routes/plugin@${lowercaseDependency}.ts`)
        }

        ['parts', 'contexts', 'loaders', 'getters', 'functions'].forEach(part => {
            const partPath = `${dependencyBase}/${part}`
            if (isDir(partPath) && fs.readdirSync(partPath).length > 0) {
                params.addVolume(`${dependencyBase}/${part}`, `${home}/${repo}/${process}/src/parts/${dependency}/${part}`)
            }
        })
    }
}

const mapPages = params => {
    let {
        process,
        processPath,
        repo,
    } = params

    const files = runOnTerminal(`find ${processPath}/pages -mindepth 1 -maxdepth 1 -type f`).split('\n')
    files.forEach(path => {
        const fileName = basename(path)
        params.addVolume(`${path}`, `${home}/${repo}/${process}/src/routes/${fileName}`)
    })

    const dirs = runOnTerminal(`find ${processPath}/pages -mindepth 1 -maxdepth 1 -type d`).split('\n')
    dirs.forEach(path => {
        if (path.trim()) {
            const fileName = basename(path)
            params.addVolume(`${path}`, `${home}/${repo}/${process}/src/routes/${fileName}`)
        }
    })
}

const mapParts = params => {
    let {
        process,
        processPath,
        repo,
    } = params

    const dirs = runOnTerminal(`find ${processPath}/parts -mindepth 1 -type d`).split('\n')
    dirs.forEach(path => {
        const name = basename(path)
        params.addVolume(`${path}`, `${home}/${repo}/${process}/src/pageParts/${name}`)
    })
}

const mapOthers = params => {
    let {
        process,
        processPath,
        repo,
    } = params

    const otherDirs = ['getters', 'functions', 'loaders']
    otherDirs.forEach(part => {
        const dirPath = `${processPath}/${part}`
        if (isDir(dirPath)) {
            params.addVolume(`${processPath}/${part}`, `${home}/${repo}/${process}/src/${part}`)
        }
    })
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

    params.processType = 'site'
    createNonExistentFiles(params)
    createDirectories(params)
    createCiCd(params)

    mapDependencies(params)
    mapSettings(params)
    mapPages(params)
    mapParts(params)
    mapOthers(params)
    mapNode(params)
    ensureLocalSecrets(params)
    const {
        composeFile,
        home,
        process,
        repo,
        tenantsPath,
    } = params
    params.addVolume(`${home}/site/src/routes/clearCache`, `${home}/${repo}/${process}/src/routes/clear-cache`)
    params.addVolume(`${home}/site/src/routes/showCache`, `${home}/${repo}/${process}/src/routes/show-cache`)
    if (tenantsPath && isFile(tenantsPath)) {
        params.addVolume(`${tenantsPath}`, `${home}/${repo}/${process}/tenants`)
    }
    params.joinVolumes()
    const composeTemplatePath = `${home}/core/container/composes/site`
    replaceVariables(composeTemplatePath, composeFile, params)
}
