import { runOnTerminal } from './terminal.js'

export default params => {
    const {
        essentialPartsPath,
        dependenciesPath,
        home,
        repo,
    } = params

    const knownDirectoryPatterns = [
        '\.git',
        '\w+Api',
        '\w+Etl',
        '\w+Panel',
        'common',
        'site\w*',
    ]

    const command = `(cat '${essentialPartsPath}'; echo; cat '${dependenciesPath}'; echo; (find ${home}/${repo} -mindepth 1 -maxdepth 1 -type d | cut -d'/' -f5 | sort)) | sort | uniq`
    const output = runOnTerminal(command)
    let dependencies = output.split('\n')

    dependencies = dependencies.filter(dep =>
        dep &&
        !knownDirectoryPatterns.some(pattern => new RegExp(pattern).test(dep))
    )
    return dependencies
}
