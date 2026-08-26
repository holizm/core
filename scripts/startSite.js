import fs from 'fs'
import { basename } from 'path'
import createCiCd from './createCiCd.js'
import createDirectories from './createDirectories.js'
import getDependencies from './getDependencies.js'
import {
    divide,
    info,
} from './logger.js'
import kebabize from './kebabize.js'
import mapNode from './mapNode.js'
import mapSettings from './mapSettings.js'
import {
    copyFileIfNotExists,
    createDirIfNotExists,
    createFileIfNotExists,
    getContent,
    isDir,
    isFile,
    replaceVariables,
    writeFile,
} from './os.js'
import { runOnTerminal } from './terminal.js'

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
    copyFileIfNotExists(`${home}/core/site/styleTemplate.css`, 'style.css')
}

const normalizeRoute = route => route
    .split('/')
    .map(segment => {
        if (segment === 'id' || segment === 'slug') {
            return `[${segment}]`
        }
        if (segment === 'path') {
            return `[...path]`
        }
        return kebabize(segment)
    })
    .join('/')

const mapDependencies = params => {
    const {
        containerHome,
        home,
        process,
        processPath,
        repo,
    } = params
    const dependencies = getDependencies(params)
    const instance = `${home}/${repo}/instance`

    for (const dependency of dependencies) {
        const dependencyPath = `${home}/${repo}/${dependency}`
        let dependencyBase = ''
        if (isDir(dependencyPath) && dependency !== 'accounts') {
            dependencyBase = `${dependencyPath}/site`
        }
        else if (isFile(instance) && isDir(`/${getContent(instance).trim()}/${dependency}`) && dependency !== 'accounts') {
            dependencyBase = `${home}/${getContent(instance).trim()}/${dependency}/site`
        }
        else {
            dependencyBase = `${home}/${dependency}/site`
        }
        const lowercaseDependency = dependency.toLowerCase()
        const pagesPath = `${dependencyBase}/pages`
        if (isDir(pagesPath)) {
            const mappings = []
            const pagePaths = runOnTerminal(`find ${pagesPath} -name index.jsx`).split('\n')

            pagePaths.forEach(pagePath => {
                if (!pagePath.trim()) {
                    return
                }

                const directoryPath = pagePath.replace('/index.jsx', '')
                const relative = directoryPath.replace(`${pagesPath}/`, '')

                const relativePath = normalizeRoute(relative)

                const source = directoryPath
                const targetPath = `${processPath}/pages/${relativePath}`

                if (!isDir(targetPath) || fs.readdirSync(targetPath).length === 0) {
                    const target = `${home}/${repo}/${process}/src/routes/${relativePath}`
                    mappings.push([source, target])
                }
            })
            mappings.sort((a, b) => a[1].localeCompare(b[1]))
            mappings.forEach(([source, target]) => {
                params.addVolume(source, target)
            })
        }

        const pluginFile = `${dependencyBase}/pages/plugin.ts`
        if (isFile(pluginFile)) {
            params.addVolume(`${dependencyBase}/pages/plugin.ts`, `${containerHome}/${repo}/${process}/src/routes/plugin@${lowercaseDependency}.ts`)
        }

        const directories = [
            'contexts',
            'functions',
            'getters',
            'loaders',
            'parts',
        ]
        directories.forEach(part => {
            const partPath = `${dependencyBase}/${part}`
            if (isDir(partPath) && fs.readdirSync(partPath).length > 0) {
                params.addVolume(`${dependencyBase}/${part}`, `${containerHome}/${repo}/${process}/src/parts/${dependency}/${part}`)
            }
        })
    }
}

const mapPages = params => {
    const {
        containerHome,
        process,
        processPath,
        repo,
    } = params

    const filePaths = runOnTerminal(`find ${processPath}/pages -mindepth 1 -maxdepth 1 -type f`).split('\n')
    filePaths.forEach(filePath => {
        const fileName = basename(filePath)
        params.addVolume(`${filePath}`, `${containerHome}/${repo}/${process}/src/routes/${fileName}`)
    })

    const directoryPaths = runOnTerminal(`find ${processPath}/pages -mindepth 1 -maxdepth 1 -type d`).split('\n')
    directoryPaths.forEach(directoryPath => {
        if (directoryPath.trim()) {
            const fileName = basename(directoryPath)
            params.addVolume(`${directoryPath}`, `${containerHome}/${repo}/${process}/src/routes/${fileName}`)
        }
    })
}

const mapParts = params => {
    const {
        containerHome,
        process,
        processPath,
        repo,
    } = params

    const directoryPaths = runOnTerminal(`find ${processPath}/parts -mindepth 1 -type d`).split('\n')
    directoryPaths.forEach(directoryPath => {
        const name = basename(directoryPath)
        params.addVolume(`${directoryPath}`, `${containerHome}/${repo}/${process}/src/pageParts/${name}`)
    })
}

const mapOthers = params => {
    const {
        containerHome,
        process,
        processPath,
        repo,
    } = params

    const directoryNames = [
        'functions',
        'getters',
        'loaders',
    ]
    directoryNames.forEach(part => {
        const directoryPath = `${processPath}/${part}`
        if (isDir(directoryPath)) {
            params.addVolume(`${processPath}/${part}`, `${containerHome}/${repo}/${process}/src/${part}`)
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
    createFileIfNotExists(`/tmp/${params.repo}/${params.process}/uiParts.json`)
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
        containerHome,
        home,
        process,
        repo,
        tenantsPath,
    } = params
    params.addVolume(`${home}/site/src/routes/clearCache`, `${containerHome}/${repo}/${process}/src/routes/clear-cache`)
    params.addVolume(`${home}/site/src/routes/showCache`, `${containerHome}/${repo}/${process}/src/routes/show-cache`)
    if (tenantsPath && isFile(tenantsPath)) {
        params.addVolume(`${tenantsPath}`, `${containerHome}/${repo}/${process}/tenants`)
    }
    params.joinVolumes()
    const composeTemplatePath = `${home}/core/container/composes/site`
    replaceVariables(composeTemplatePath, composeFile, params)
}
