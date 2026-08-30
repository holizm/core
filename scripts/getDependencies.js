import { warning } from './logger.js'
import {
    getLines,
    isFile,
} from './os.js'
import { runOnTerminal } from './terminal.js'

export default params => {
    const {
        dependenciesPath,
        essentialPartsPath,
        home,
        repo,
    } = params

    const knownDirectoryPatterns = [
        '^\\.git$',
        '^\\.github$',
        '^\\w+Api$',
        '^\\w+Etl$',
        '^\\w+Panel$',
        '^common$',
        '^site\\w*$',
    ]
    const definedDependencies = getLines(dependenciesPath)
    const runnableDependencies = runOnTerminal(`find ${home}/${repo} -mindepth 1 -maxdepth 1 -type d -printf '%f\\n'`)
        .split('\n')
        .filter(Boolean)
        .filter(dependency =>
            isFile(`${home}/${repo}/${dependency}/part`) ||
            isFile(`${home}/${dependency}/part`)
        )

    for (const runnableDependency of runnableDependencies.filter(dependency => definedDependencies.includes(dependency))) {
        warning(`Runnable part ${runnableDependency} does not need to be listed in ${dependenciesPath}`)
    }

    const dependencies = Array.from(new Set([
        ...getLines(essentialPartsPath),
        ...definedDependencies,
        ...runnableDependencies,
    ]))
        .filter(dependency =>
            dependency &&
            !knownDirectoryPatterns.some(pattern => new RegExp(pattern).test(dependency))
        )
        .sort()
    return dependencies
}
