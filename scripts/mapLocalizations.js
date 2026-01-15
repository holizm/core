import { runOnTerminal } from './terminal.js'
import getDependencies from "./getDependencies.js"

export default params => {
    const {
        home,
    } = params
    const coreLocalizations = [
        `${home}/core/localization`,
        `${home}/api/localization`,
        `${home}/panel/localization`,
        `${home}/site/localization`,
    ]
    for (const item of coreLocalizations) {
        params.addVolume(item, item)
    }
    const findCommand = `
        find ${home} -type d -name '.git' 2>/dev/null | 
        while read gitdir; do
            repoDir=$(dirname $gitdir)
            find $repoDir -type d -name localization
        done | 
        sort
    `
    const dependencies = getDependencies(params)
    const items = runOnTerminal(findCommand).split('\n')
    for (const item of items) {
        if (dependencies.some(dependency => item.includes(`/${dependency}/`))) {
            params.addVolume(item, item)
        }
    }
}
