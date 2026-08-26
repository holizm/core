import {
    isDir,
    isFile,
} from './os.js'

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
    const localizationPaths = new Set([
        `${home}/api/localization`,
        `${home}/core/localization`,
        `${home}/panel/localization`,
        `${home}/site/localization`,
    ])
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
