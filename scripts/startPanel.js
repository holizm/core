import fs from "fs"
import path from "path"
import { execSync } from "child_process"
import {
    divide,
    info,
} from "./logger.js"
import {
    getFileContent,
    writeFile,
    exit,
    isFile,
    copyFileIfNotExists,
    isDir,
    writeFileIfNotExists,
} from "./os.js"
import { runOnTerminal } from "./terminal.js"
import createGitHubAction from './createGitHubAction.js'
import getDependencies from "./getDependencies.js"
import buildLocalizationMappings from "./buildLocalizationMappings.js"
import buildPackageMapping from "./buildPackageMapping.js"

const indentation = ' '.repeat(12)

const createNonExistentFiles = params => {
    const {
        home,
    } = params
    const basePath = `${home}/core/panel`
    const files = {
        "menu.jsx": "menuTemplate",
        "routes.jsx": "routesTemplate",
        "appActions.jsx": "appActionsTemplate",
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
        volumes,
    } = params

    const dependencies = getDependencies(params)

    for (const dependency of dependencies) {

        let runnablePart = false
        const dependencyPath = `${home}/${repo}/${dependency}`
        let dependencyBase = ""

        if (isDir(dependencyPath) && dependency !== "accounts") {
            dependencyBase = `${dependencyPath}/panel`
            runnablePart = true
        } else {
            dependencyBase = `${home}/${dependency}/panel`
        }

        if (runnablePart) {
            volumes += `\n${indentation}- ${home}/${repo}/${dependency}:/${dependency}`
        } else {
            volumes += `\n${indentation}- ${dependencyBase}:/${dependency}`
        }

        if (process.includes("admin")) {
            volumes += `\n${indentation}- ${dependencyBase}/admin:/${repo}/${process}/src/${dependency}/admin`
        }

        if (fs.existsSync(path.join(dependencyBase, "common"))) {
            volumes += `\n${indentation}- ${dependencyBase}/common:/${repo}/${process}/src/${dependency}/common`
        }
    }

    return volumes
}

const buildRunnablePanelMappings = params => {
    let {
        repo,
        org,
        process,
        volumes,
        home,
    } = params

    const dirs = runOnTerminal("find . -mindepth 1 -maxdepth 1 -type d -not -name .github -not -name .git | sort").split("\n")

    for (const item of dirs) {
        const replacedItem = item.replace(/^.\//, "")
        if (!replacedItem) continue
        volumes += `\n${indentation}- /${repo}/${process}/${replacedItem}:/${repo}/${process}/src/runnable/${replacedItem}`
    }

    const links = runOnTerminal("find . -mindepth 1 -maxdepth 1 -type l | sort").split("\n")

    for (const item of links) {
        if (item.trim() === "") continue
        const linkTarget = fs.readlinkSync(item)
        const parts = linkTarget.replace(/^\/+/, "").split("/")
        const role = parts.length > 4 ? parts[4] : "Role"

        const replacedItem = item.replace(/^.\//, "")
        if (!replacedItem) continue

        volumes += `\n${indentation}- /${repo}/${process}/${replacedItem}:/${repo}/${process}/src/${replacedItem}/${role}`
    }

    return volumes
}

const buildSecrets = params => {
    let {
        home,
        process,
        repo,
        volumes,
    } = params
    if (!isDir(`${home}/secrets`)) fs.mkdirSync(`${home}/secrets`)
    const commonFile = `${home}/secrets/common.json`
    if (!isFile(commonFile)) fs.writeFileSync(commonFile, '{}')
    const secretFile = `${home}/secrets/${repo}.json`
    if (!isFile(secretFile)) fs.writeFileSync(secretFile, '{}')

    volumes += `\n${indentation}- ${commonFile}:/${repo}/${process}/public/common.json`
    volumes += `\n${indentation}- ${secretFile}:/${repo}/${process}/public/repo.json`
    return volumes
}

export default params => {
    info("Setting up Panel")
    divide()

    createNonExistentFiles(params)
    createGitHubAction({
        ...params,
        processType: "panel",
    })

    let volumes = ""
    volumes += buildDependenciesMappings({
        ...params,
        volumes,
    })
    volumes += buildLocalizationMappings({
        ...params,
        volumes,
    })
    volumes += buildRunnablePanelMappings({
        ...params,
        volumes,
    })
    volumes += buildSecrets({
        ...params,
        volumes,
    })
    volumes += buildPackageMapping({
        ...params,
        volumes,
    })

    const {
        composeFile,
        home,
        menusDirectoryPath,
        panelLock,
        panelPackageJson,
        process,
        repo,
        settingsOverridePath,
        tenantsPath,
    } = params
    if (isFile(settingsOverridePath)) {
        volumes += `\n${indentation}- ${settingsOverridePath}:/${repo}/${process}/public/settingsOverride.json`
    }
    if (isFile(tenantsPath)) {
        volumes += `\n${indentation}- ${tenantsPath}:/${repo}/${process}/public/tenants`
    }
    if (isDir(menusDirectoryPath)) {
        volumes += `\n${indentation}- ${menusDirectoryPath}:/${repo}/${process}/src/menus`
    }
    params.volumes = volumes
    const composeTemplatePath = `${home}/core/container/composes/panel`
    replaceVariables(composeTemplatePath, composeFile, params)
}
