import { runOnTerminal } from './terminal.js'

export default params => {
    const {
        dependenciesPath,
        home,
    } = params
    const findCommand = `
    find ${home} -type d -name '.git' 2>/dev/null | while read gitdir; do
        repoDir=$(dirname '$gitdir')
        origin=$(git -C '$repoDir' remote get-url origin 2>/dev/null)
        if [[ '$origin' == *'github.com/holizm/'* ]]; then
            find '$repoDir' -type d -name 'localization' 2>/dev/null
        fi
    done | grep -Ff ${dependenciesPath} -e 'api' | sort
    `
    const items = runOnTerminal(findCommand).split('\n')
    for (const item of items) if (item.trim()) params.addVolume(`${item}`, `${item}`)
}
