import fg from 'fast-glob'
import getApiRepo from './getApiRepo.js'
import isDir from './isDir.js'
import isFile from './isFile.js'
import { warning } from './logger.js'
import { getLines } from './os.js'
import { runOnTerminal } from './terminal.js'

export default params => {
    const {
        dependenciesPath,
        essentialPartsPath,
        home,
        process,
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
    const nodeModulesPath = `${home}/${repo}/${process}/node_modules`
    const composedDependencies = isDir(nodeModulesPath)
        ?
        fg.sync('*/part', {
            cwd: nodeModulesPath,
            onlyFiles: true,
        }).map(file => file.split('/')[0])
        :
        []
    const runnableRepos = [...new Set([repo, getApiRepo(repo)])]
    const runnableDependencies = runnableRepos.flatMap(runnableRepo =>
        runOnTerminal(`find ${home}/${runnableRepo} -mindepth 1 -maxdepth 1 -type d -printf '%f\\n'`)
            .split('\n')
            .filter(Boolean)
            .filter(dependency => isFile(`${home}/${runnableRepo}/${dependency}/part`))
    )

    for (const runnableDependency of runnableDependencies.filter(dependency => definedDependencies.includes(dependency))) {
        warning(`Runnable part ${runnableDependency} does not need to be listed in ${dependenciesPath}`)
    }

    const dependencies = Array.from(new Set([
        ...getLines(essentialPartsPath),
        ...definedDependencies,
        ...composedDependencies,
        ...runnableDependencies,
    ]))
        .filter(dependency =>
            dependency &&
            !knownDirectoryPatterns.some(pattern => new RegExp(pattern).test(dependency))
        )
        .sort()
    return dependencies
}
