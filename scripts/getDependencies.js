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

    const command = `(cat '${essentialPartsPath}'; echo; cat '${dependenciesPath}'; echo; (find ${home}/${repo} -mindepth 1 -maxdepth 1 -type d -exec test -f "{}/part" \\; -print | cut -d'/' -f5 | sort)) | sort | uniq`

    const commandOutput = runOnTerminal(command)
    const dependencies = commandOutput.split('\n').filter(dependency =>
        dependency &&
        !knownDirectoryPatterns.some(pattern => new RegExp(pattern).test(dependency))
    )
    return dependencies
}
