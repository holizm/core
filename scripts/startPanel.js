import fs from 'fs'
import path from 'path'
import {
    divide,
    info,
} from './logger.js'
import {
    copyFileIfNotExists,
    isDir,
    isFile,
    replaceVariables,
} from './os.js'
import { runOnTerminal } from './terminal.js'
import createCiCd from './createCiCd.js'
import getDependencies from './getDependencies.js'
import mapLocalizations from './mapLocalizations.js'
import mapNode from './mapNode.js'
import mapSettings from './mapSettings.js'
import createDirectories from './createDirectories.js'

const createNonExistentFiles = params => {
    const {
        home,
        privateSettingsPath,
        publicSettingsPath,
    } = params
    const basePath = `${home}/core/panel`
    const files = {
        'menu.jsx': 'menuTemplate',
        'routes.jsx': 'routesTemplate',
        'appActions.jsx': 'appActionsTemplate',
        'settingsOverride.json': 'settingsOverrideTemplate',
    }
    for (const [target, template] of Object.entries(files)) {
        if (!isFile(target)) {
            copyFileIfNotExists(`${basePath}/${template}`, target)
        }
    }
    copyFileIfNotExists(`${home}/core/api/privateSettingsTemplate`, privateSettingsPath)
    copyFileIfNotExists(`${home}/core/api/publicSettingsTemplate`, publicSettingsPath)
}

const mapDependencies = params => {
    let {
        containerHome,
        home,
        process,
        repo,
    } = params

    const dependencies = getDependencies(params)

    for (const dependency of dependencies) {

        let runnablePart = false
        const dependencyPath = `${home}/${repo}/${dependency}`
        let dependencyBase = ''

        if (isDir(dependencyPath) && dependency !== 'accounts') {
            dependencyBase = `${dependencyPath}/panel`
            runnablePart = true
        } else {
            dependencyBase = `${home}/${dependency}/panel`
        }

        if (runnablePart) {
            params.addVolume(`${home}/${repo}/${dependency}`, `${containerHome}/${repo}/${dependency}`)
        } else {
            params.addVolume(dependencyBase, dependencyBase)
        }

        if (process.includes('admin')) {
            params.addVolume(`${dependencyBase}/admin`, `${containerHome}/${repo}/${process}/src/${dependency}/admin`)
        }

        if (fs.existsSync(path.join(dependencyBase, 'common'))) {
            params.addVolume(`${dependencyBase}/common`, `${containerHome}/${repo}/${process}/src/${dependency}/common`)
        }
    }
}

const mapRunnable = params => {
    let {
        home,
        repo,
        process,
    } = params

    const dirs = runOnTerminal('find . -mindepth 1 -maxdepth 1 -type d -not -name .github -not -name .git | sort').split('\n')

    for (const item of dirs) {
        const replacedItem = item.replace(/^.\//, '')
        if (!replacedItem) continue
        params.addVolume(`${home}/${repo}/${process}/${replacedItem}`, `${containerHome}/${repo}/${process}/src/runnable/${replacedItem}`)
    }

    const links = runOnTerminal('find . -mindepth 1 -maxdepth 1 -type l | sort').split('\n')

    for (const item of links) {
        if (item.trim() === '') continue
        const linkTarget = fs.readlinkSync(item)
        const parts = linkTarget.replace(/^\/+/, '').split('/')
        const role = parts.length > 4 ? parts[4] : 'Role'

        const replacedItem = item.replace(/^.\//, '')
        if (!replacedItem) continue

        params.addVolume(`${home}/${repo}/${process}/${replacedItem}`, `${containerHome}/${repo}/${process}/src/${replacedItem}/${role}`)
    }
}

const mapSecrets = params => {
    let {
        containerHome,
        home,
        process,
        repo,
    } = params
    if (!isDir(`${home}/secrets`)) fs.mkdirSync(`${home}/secrets`)
    const commonFile = `${home}/secrets/common.json`
    if (!isFile(commonFile)) fs.writeFileSync(commonFile, '{}')
    const secretFile = `${home}/secrets/${repo}.json`
    if (!isFile(secretFile)) fs.writeFileSync(secretFile, '{}')

    params.addVolume(`${commonFile}`, `${containerHome}/${repo}/${process}/public/common.json`)
    params.addVolume(`${secretFile}`, `${containerHome}/${repo}/${process}/public/repo.json`)
}

export default params => {
    info('Setting up Panel')
    divide()

    params.processType = 'panel'
    createNonExistentFiles(params)
    createDirectories(params)
    createCiCd(params)

    mapDependencies(params)
    mapSettings(params)
    mapLocalizations(params)
    mapRunnable(params)
    mapSecrets(params)
    mapNode(params)

    const {
        composeFile,
        containerHome,
        home,
        menusDirectoryPath,
        process,
        repo,
        tenantsPath,
    } = params
    if (isFile(tenantsPath)) {
        params.addVolume(`${tenantsPath}`, `${containerHome}/${repo}/${process}/public/tenants`)
    }
    if (isDir(menusDirectoryPath)) {
        params.addVolume(`${menusDirectoryPath}`, `${containerHome}/${repo}/${process}/src/menus`)
    }

    params.joinVolumes()
    const composeTemplatePath = `${home}/core/container/composes/panel`
    replaceVariables(composeTemplatePath, composeFile, params)
}
