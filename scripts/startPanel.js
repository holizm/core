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
} from "./os.js"
import { runOnTerminal } from "./terminal.js"
import createGitHubAction from './createGitHubAction.js'
import getDependencies from "./getDependencies.js"

const indentation = ' '.repeat(12)

const createNonExistentFiles = params => {
    const {
        home,
    } = params
    const basePath = `${home}/core/panel`
    const files = {
        "menu.jsx": "menuTemplate",
        "routes.jsx": "routesTemplate",
        "headerActions.jsx": "headerActionsTemplate",
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
            volumes += `\n${indentation}- ${dependencyBase}:${dependencyBase}`
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

const buildLocalizationMappings = params => {
    let volumes = ""
    const repo = process.env.repo
    const result = runOnTerminal
        ? runOnTerminal(`find /HolismHolding /${repo} -maxdepth 3 -type d -name Localization 2>/dev/null | sort`)
        : execSync(`find /HolismHolding /${repo} -maxdepth 3 -type d -name Localization 2>/dev/null | sort`, { encoding: "utf8" })

    for (const item of result.split("\n")) {
        if (item.trim() === "") continue
        volumes += `\n${indentation}- ${item}:${item}`
    }

    return volumes
}

const buildRunnablePanelMappings = params => {
    let volumes = ""
    const repo = process.env.repo
    const process = process.env.Process

    const dirs = (runOnTerminal
        ? runOnTerminal("find . -mindepth 1 -maxdepth 1 -type d -not -name .github -not -name .git | sort")
        : execSync("find . -mindepth 1 -maxdepth 1 -type d -not -name .github -not -name .git | sort", { encoding: "utf8" })
    ).split("\n")

    for (const item of dirs) {
        const replacedItem = item.replace(/^.\//, "")
        if (!replacedItem) continue
        volumes += `\n${indentation}- /${repo}/${process}/${replacedItem}:/${repo}/${process}/src/Runnable/${replacedItem}`
    }

    const links = (runOnTerminal
        ? runOnTerminal("find . -mindepth 1 -maxdepth 1 -type l | sort")
        : execSync("find . -mindepth 1 -maxdepth 1 -type l | sort", { encoding: "utf8" })
    ).split("\n")

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

export default params => {
    info("Setting up Panel")
    divide()

    createNonExistentFiles(params)
    createGitHubAction({
        ...params,
        processType: "panel",
    })

    let volumes = ""
    volumes += buildDependenciesMappings(params)
    info(volumes)
    exit()
    volumes += buildLocalizationMappings(params)
    volumes += buildRunnablePanelMappings(params)

    const settingsOverridePath = process.env.SettingsOverridePath
    const tenantsPath = process.env.TenantsPath
    const menusDirectoryPath = process.env.MenusDirectoryPath
    const repo = process.env.repo
    const process = process.env.Process

    if (settingsOverridePath && fs.existsSync(settingsOverridePath)) {
        volumes += `\n${indentation}- /${repo}/${process}/SettingsOverride.json:/${repo}/${process}/public/SettingsOverride.json`
    }

    if (tenantsPath && fs.existsSync(tenantsPath)) {
        volumes += `\n${indentation}- ${tenantsPath}:/${repo}/${process}/public/Tenants`
    }

    if (menusDirectoryPath && fs.existsSync(menusDirectoryPath)) {
        volumes += `\n${indentation}- ${menusDirectoryPath}:/${repo}/${process}/src/Menus`
    }

    const composeTemplatePath = "/HolismHolding/Docker/Composes/Panel"
    const composeFile = process.env.ComposeFile

    let content = getFileContent(composeTemplatePath)
    content = content.replace(/\$\{([^}]+)\}/g, (_, name) => process.env[name] || "")
    content = content.replace("DependenciesMappingPlaceHolder", volumes)

    writeFile(composeFile, content)
}
