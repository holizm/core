// panel.js
import fs from "fs"
import path from "path"
import { execSync } from "child_process"

import { info, divide } from "./Logger.js"
import { setPermissions, runOnTerminal, getFileLines, getFileContent, writeFile } from "./Os.js"
import { createGitHubAction } from "./CreateGitHubAction.js"

export function createNonExistentFilesForPanel() {
    const basePath = "/HolismHolding/Infra/Panel"
    const cwd = process.cwd()

    const files = {
        "Menu.jsx": "MenuTemplate",
        "Routes.jsx": "RoutesTemplate",
        "HeaderActions.jsx": "HeaderActionsTemplate",
    }

    for (const [target, template] of Object.entries(files)) {
        if (!fs.existsSync(target)) {
            fs.copyFileSync(`${basePath}/${template}`, target)
        }
    }

    const logoPath = process.env.LogoPath
    if (logoPath && !fs.existsSync(logoPath)) {
        fs.copyFileSync(`${basePath}/LogoTemplate`, logoPath)
    }

    setPermissions(cwd)
}

export function buildDependenciesMappingsForPanel() {
    let volumes = ""
    const repository = process.env.Repository
    const processName = process.env.Process
    const dependenciesPath = process.env.DependenciesPath

    const dependencies = getFileLines(dependenciesPath)
    for (const dependency of dependencies) {
        if (dependency.trim() === "") continue

        let runnablePart = false
        const dependencyPath = `/${repository}/${dependency}`
        let dependencyBase = ""

        if (fs.existsSync(dependencyPath) && fs.statSync(dependencyPath).isDirectory() && dependency !== "Accounts") {
            dependencyBase = `${dependencyPath}/Panel`
            runnablePart = true
        } else {
            dependencyBase = `/HolismHolding/${dependency}/Panel`
        }

        if (dependency === "Common") continue

        if (runnablePart) {
            volumes += `\n            - /${repository}/${dependency}:/${repository}/${dependency}`
        } else {
            volumes += `\n            - ${dependencyBase}:${dependencyBase}`
        }

        if (path.basename(process.cwd()).includes("Admin")) {
            volumes += `\n            - ${dependencyBase}/Admin:/${repository}/${processName}/src/${dependency}/Admin`
        }

        if (fs.existsSync(path.join(dependencyBase, "Common"))) {
            volumes += `\n            - ${dependencyBase}/Common:/${repository}/${processName}/src/${dependency}/Common`
        }
    }

    return volumes
}

export function buildLocalizationMappingsForPanel() {
    let volumes = ""
    const repository = process.env.Repository
    const result = runOnTerminal
        ? runOnTerminal(`find /HolismHolding /${repository} -maxdepth 3 -type d -name Localization 2>/dev/null | sort`)
        : execSync(`find /HolismHolding /${repository} -maxdepth 3 -type d -name Localization 2>/dev/null | sort`, { encoding: "utf8" })

    for (const item of result.split("\n")) {
        if (item.trim() === "") continue
        volumes += `\n            - ${item}:${item}`
    }

    return volumes
}

export function buildRunnablePanelMappings() {
    let volumes = ""
    const repository = process.env.Repository
    const processName = process.env.Process

    const dirs = (runOnTerminal
        ? runOnTerminal("find . -mindepth 1 -maxdepth 1 -type d -not -name .github -not -name .git | sort")
        : execSync("find . -mindepth 1 -maxdepth 1 -type d -not -name .github -not -name .git | sort", { encoding: "utf8" })
    ).split("\n")

    for (const item of dirs) {
        const replacedItem = item.replace(/^.\//, "")
        if (!replacedItem) continue
        volumes += `\n            - /${repository}/${processName}/${replacedItem}:/${repository}/${processName}/src/Runnable/${replacedItem}`
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

        volumes += `\n            - /${repository}/${processName}/${replacedItem}:/${repository}/${processName}/src/${replacedItem}/${role}`
    }

    return volumes
}

export function startPanel() {
    info("Setting up Panel")
    divide()

    createNonExistentFilesForPanel()
    createGitHubAction("Panel")

    let volumes = buildDependenciesMappingsForPanel()
    volumes += buildLocalizationMappingsForPanel()
    volumes += buildRunnablePanelMappings()

    const settingsOverridePath = process.env.SettingsOverridePath
    const tenantsPath = process.env.TenantsPath
    const menusDirectoryPath = process.env.MenusDirectoryPath
    const repository = process.env.Repository
    const processName = process.env.Process

    if (settingsOverridePath && fs.existsSync(settingsOverridePath)) {
        volumes += `\n            - /${repository}/${processName}/SettingsOverride.json:/${repository}/${processName}/public/SettingsOverride.json`
    }

    if (tenantsPath && fs.existsSync(tenantsPath)) {
        volumes += `\n            - ${tenantsPath}:/${repository}/${processName}/public/Tenants`
    }

    if (menusDirectoryPath && fs.existsSync(menusDirectoryPath)) {
        volumes += `\n            - ${menusDirectoryPath}:/${repository}/${processName}/src/Menus`
    }

    const composeTemplatePath = "/HolismHolding/Docker/Composes/Panel"
    const composeFile = process.env.ComposeFile

    let content = getFileContent(composeTemplatePath)
    content = content.replace(/\$\{([^}]+)\}/g, (_, name) => process.env[name] || "")
    content = content.replace("DependenciesMappingPlaceHolder", volumes)

    writeFile(composeFile, content)
}
