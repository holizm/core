import copy from "./copy.js"
import getDependencies from "./getDependencies.js"
import { info } from './logger.js'
import { createDirIfNotExists } from './os.js'

export default params => {
    const {
        org,
        repo,
        process,
    } = params
    info('Copying dependencies ...')
    createDirIfNotExists(`/tmp/build/${repo}/${process}`)
    const dependencies = getDependencies(params)
    for (const dependency of dependencies) {
        copy({ ...params, directory: dependency })
    }
}
/*
function CopyDependencies()
{

    while IFS= read -r Dependency || [ -n '$Dependency' ]
    do
        if [ -d '/$Repository/$Dependency' ] && [ '$Dependency' != 'Accounts' ]; then
            Info 'Copying /$Repository/$Dependency';
            cp -r /$Repository/$Dependency /Build/$Repository/$Dependency
        else
            if [ ! -d /HolismHolding/$Dependency ]; then
                continue;
            fi
            Info 'Copying /HolismHolding/$Dependency';
            cp -r /HolismHolding/$Dependency /Build/HolismHolding/$Dependency
        fi
    done < $DependenciesPath
}

*/
