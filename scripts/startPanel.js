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
import createGitHubAction from './createGitHubAction.js'
import getDependencies from './getDependencies.js'
import buildLocalizationMappings from './buildLocalizationMappings.js'
import buildPackageMapping from './buildPackageMapping.js'
import indentation from './indentation.js'

const createNonExistentFiles = params => {
    const {
        home,
    } = params
    const basePath = `${home}/core/panel`
    const files = {
        'menu.jsx': 'menuTemplate',
        'routes.jsx': 'routesTemplate',
        'appActions.jsx': 'appActionsTemplate',
    }
    for (const [target, template] of Object.entries(files)) {
        if (!isFile(target)) {
            copyFileIfNotExists(`${basePath}/${template}`, target)
        }
    }
}

const buildDependenciesMappings = params => {
    let {
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
            params.volumes += `\n${indentation}- ${home}/${repo}/${dependency}:/${dependency}`
        } else {
            params.volumes += `\n${indentation}- ${dependencyBase}:/${dependency}`
        }

        if (process.includes('admin')) {
            params.volumes += `\n${indentation}- ${dependencyBase}/admin:/${repo}/${process}/src/${dependency}/admin`
        }

        if (fs.existsSync(path.join(dependencyBase, 'common'))) {
            params.volumes += `\n${indentation}- ${dependencyBase}/common:/${repo}/${process}/src/${dependency}/common`
        }
    }
}

const buildRunnablePanelMappings = params => {
    let {
        repo,
        process,
    } = params

    const dirs = runOnTerminal('find . -mindepth 1 -maxdepth 1 -type d -not -name .github -not -name .git | sort').split('\n')

    for (const item of dirs) {
        const replacedItem = item.replace(/^.\//, '')
        if (!replacedItem) continue
        params.volumes += `\n${indentation}- /${repo}/${process}/${replacedItem}:/${repo}/${process}/src/runnable/${replacedItem}`
    }

    const links = runOnTerminal('find . -mindepth 1 -maxdepth 1 -type l | sort').split('\n')

    for (const item of links) {
        if (item.trim() === '') continue
        const linkTarget = fs.readlinkSync(item)
        const parts = linkTarget.replace(/^\/+/, '').split('/')
        const role = parts.length > 4 ? parts[4] : 'Role'

        const replacedItem = item.replace(/^.\//, '')
        if (!replacedItem) continue

        params.volumes += `\n${indentation}- /${repo}/${process}/${replacedItem}:/${repo}/${process}/src/${replacedItem}/${role}`
    }
}

const buildSecrets = params => {
    let {
        home,
        process,
        repo,
    } = params
    if (!isDir(`${home}/secrets`)) fs.mkdirSync(`${home}/secrets`)
    const commonFile = `${home}/secrets/common.json`
    if (!isFile(commonFile)) fs.writeFileSync(commonFile, '{}')
    const secretFile = `${home}/secrets/${repo}.json`
    if (!isFile(secretFile)) fs.writeFileSync(secretFile, '{}')

    params.volumes += `\n${indentation}- ${commonFile}:/${repo}/${process}/public/common.json`
    params.volumes += `\n${indentation}- ${secretFile}:/${repo}/${process}/public/repo.json`
}

export default params => {
    info('Setting up Panel')
    divide()

    params.processType = 'panel'
    createNonExistentFiles(params)
    createGitHubAction(params)

    params.volumes = ''
    buildDependenciesMappings(params)
    buildLocalizationMappings(params)
    buildRunnablePanelMappings(params)
    buildSecrets(params)
    buildPackageMapping(params)

    const {
        composeFile,
        home,
        menusDirectoryPath,
        process,
        repo,
        settingsOverridePath,
        tenantsPath,
    } = params
    if (isFile(settingsOverridePath)) {
        params.volumes += `\n${indentation}- ${settingsOverridePath}:/${repo}/${process}/public/settingsOverride.json`
    }
    if (isFile(tenantsPath)) {
        params.volumes += `\n${indentation}- ${tenantsPath}:/${repo}/${process}/public/tenants`
    }
    if (isDir(menusDirectoryPath)) {
        params.volumes += `\n${indentation}- ${menusDirectoryPath}:/${repo}/${process}/src/menus`
    }
    const composeTemplatePath = `${home}/core/container/composes/panel`
    replaceVariables(composeTemplatePath, composeFile, params)
}
