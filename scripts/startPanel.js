import fs from 'fs'
import path from 'path'
import createCiCd from './createCiCd.js'
import createDirectories from './createDirectories.js'
import {
    divide,
    info,
} from './logger.js'
import mapLocalizations from './mapLocalizations.js'
import mapNode from './mapNode.js'
import mapSettings from './mapSettings.js'
import {
    copyFileIfNotExists,
    isDir,
    isFile,
    replaceVariables,
} from './os.js'
import { measure } from './timing.js'
import { runOnTerminal } from './terminal.js'

const createNonExistentFiles = params => {
    const {
        home,
        privateSettingsPath,
        publicSettingsPath,
    } = params
    const basePath = `${home}/core/panel`
    const files = {
        'appActions.jsx': 'appActionsTemplate',
        'menu.jsx': 'menuTemplate',
        'routes.jsx': 'routesTemplate',
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
    const {
        containerHome,
        dependencies,
        home,
        process,
        repo,
    } = params

    for (const dependency of dependencies) {
        let runnablePart = false
        const dependencyPath = `${home}/${repo}/${dependency}`
        let dependencyBase = ''

        if (isDir(dependencyPath) && dependency !== 'accounts') {
            dependencyBase = `${dependencyPath}/panel`
            runnablePart = true
        }
        else {
            dependencyBase = `${home}/${dependency}/panel`
        }

        if (runnablePart) {
            params.addVolume(`${home}/${repo}/${dependency}`, `${containerHome}/${repo}/${dependency}`)
        }
        else {
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
    const {
        containerHome,
        home,
        process,
        repo,
    } = params

    const directoryPaths = runOnTerminal('find . -mindepth 1 -maxdepth 1 -type d -not -name .github -not -name .git | sort').split('\n')

    for (const directoryPath of directoryPaths) {
        const replacedItem = directoryPath.replace(/^.\//, '')
        if (!replacedItem) {
            continue
        }
        params.addVolume(`${home}/${repo}/${process}/${replacedItem}`, `${containerHome}/${repo}/${process}/src/runnable/${replacedItem}`)
    }

    const linkPaths = runOnTerminal('find . -mindepth 1 -maxdepth 1 -type l | sort').split('\n')

    for (const linkPath of linkPaths) {
        if (linkPath.trim() === '') {
            continue
        }
        const linkTarget = fs.readlinkSync(linkPath)
        const parts = linkTarget.replace(/^\/+/, '').split('/')
        const role =
            parts.length > 4
            ?
            parts[4]
            :
            'Role'

        const replacedItem = linkPath.replace(/^.\//, '')
        if (!replacedItem) {
            continue
        }

        params.addVolume(`${home}/${repo}/${process}/${replacedItem}`, `${containerHome}/${repo}/${process}/src/${replacedItem}/${role}`)
    }
}

const mapSecrets = params => {
    const {
        containerHome,
        home,
        process,
        repo,
    } = params
    if (!isDir(`${home}/secrets`)) {
        fs.mkdirSync(`${home}/secrets`)
    }
    const commonFile = `${home}/secrets/common.json`
    const secretFile = `${home}/secrets/${repo}.json`
    if (!isFile(commonFile)) {
        fs.writeFileSync(commonFile, '{}')
    }
    if (!isFile(secretFile)) {
        fs.writeFileSync(secretFile, '{}')
    }

    params.addVolume(`${commonFile}`, `${containerHome}/${repo}/${process}/public/common.json`)
    params.addVolume(`${secretFile}`, `${containerHome}/${repo}/${process}/public/repo.json`)
}

export default params => {
    info('Setting up Panel')
    divide()

    params.processType = 'panel'
    measure('panel: create missing files', () => createNonExistentFiles(params))
    measure('panel: create directories', () => createDirectories(params))
    measure('panel: create CI/CD', () => createCiCd(params))

    measure('panel: map dependencies', () => mapDependencies(params))
    measure('panel: map settings', () => mapSettings(params))
    measure('panel: map localizations', () => mapLocalizations(params))
    measure('panel: map runnable files', () => mapRunnable(params))
    measure('panel: map secrets', () => mapSecrets(params))
    measure('panel: map Node files', () => mapNode(params))

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

    measure('panel: join volumes', () => params.joinVolumes())
    const composeTemplatePath = `${home}/core/container/composes/panel`
    measure('panel: create Compose file', () => replaceVariables(composeTemplatePath, composeFile, params))
}
