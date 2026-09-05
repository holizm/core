import fs from 'node:fs'
import path from 'node:path'
import {
    isDir,
    isFile,
} from './os.js'

const createPanelLocalization = params => {
    const {
        composeFile,
        home,
        panelUiRepo,
    } = params
    const localizationPath = path.join(path.dirname(composeFile), 'panelLocalization')
    const sourcePaths = [
        `${home}/panel/localization`,
        `${home}/${panelUiRepo || 'complexPanel'}/localization`,
    ].filter(isDir)
    const localeFiles = new Set(sourcePaths.flatMap(sourcePath =>
        fs.readdirSync(sourcePath).filter(file => file.endsWith('.json'))
    ))

    fs.mkdirSync(localizationPath, { recursive: true })
    for (const localeFile of localeFiles) {
        const localization = {}
        for (const sourcePath of sourcePaths) {
            const sourceFile = `${sourcePath}/${localeFile}`
            if (isFile(sourceFile)) {
                Object.assign(localization, JSON.parse(fs.readFileSync(sourceFile, 'utf8')))
            }
        }
        fs.writeFileSync(
            `${localizationPath}/${localeFile}`,
            `${JSON.stringify(localization, null, 4)}\n`,
        )
    }
    return localizationPath
}

const getDependencyRoot = params => {
    const {
        dependency,
        home,
        repo,
    } = params
    const runnableDependencyRoot = `${home}/${repo}/${dependency}`
    if (dependency !== 'accounts' && isDir(runnableDependencyRoot)) {
        return runnableDependencyRoot
    }
    return `${home}/${dependency}`
}

const getPartLocalizationPaths = dependencyRoot => {
    const localizationPaths = [
        `${dependencyRoot}/api/localization`,
        `${dependencyRoot}/localization`,
        `${dependencyRoot}/panel/localization`,
        `${dependencyRoot}/site/localization`,
    ].filter(isDir)
    return localizationPaths
}

export default params => {
    const {
        containerHome,
        dependencies,
        home,
        repo,
    } = params
    const panelLocalizationPath = createPanelLocalization(params)
    const localizationPaths = new Set([
        `${home}/api/localization`,
        `${home}/core/localization`,
        `${home}/site/localization`,
    ].filter(isDir))
    params.addVolume(panelLocalizationPath, `${containerHome}/panel/localization`)
    for (const dependency of dependencies) {
        const dependencyRoot = getDependencyRoot({
            dependency,
            home,
            repo,
        })
        if (!isFile(`${dependencyRoot}/part`)) {
            continue
        }
        const dependencyLocalizationPaths = getPartLocalizationPaths(dependencyRoot)
        for (const localizationPath of dependencyLocalizationPaths) {
            localizationPaths.add(localizationPath)
        }
    }
    for (const localizationPath of localizationPaths) {
        const rightSide = localizationPath.replace(home, containerHome)
        params.addVolume(localizationPath, rightSide)
    }
}
