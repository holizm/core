import { runOnTerminal } from './terminal.js'

export default params => {
    const {
        containerHome,
        dependencies,
        home,
        repo,
    } = params
    const coreLocalizations = [
        `${home}/core/localization`,
        `${home}/api/localization`,
        `${home}/panel/localization`,
        `${home}/site/localization`,
    ]
    for (const item of coreLocalizations) {
        const rightSide = item.replace(home, containerHome)
        params.addVolume(item, rightSide)
    }
    const findCommand = `
        find ${home} -type d -name '.git' 2>/dev/null |
        while read gitdir; do
            repoDir=$(dirname $gitdir)
            find $repoDir -type d -name localization
        done |
        sort
    `
    const items = runOnTerminal(findCommand).split('\n')
    for (const item of items) {
        if (dependencies.some(dependency => item.includes(`/${dependency}/`))) {
            const rightSide = item.replace(home, containerHome)
            params.addVolume(item, rightSide)
        }
    }
}
