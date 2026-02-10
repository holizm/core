import copyDependencies from './copyDependencies.js'
import copy from './copy.js'

export default params => {
    copy({ ...params, repo: 'core' })
    copy({ ...params, repo: 'fonts' })
    copy({ ...params, repo: 'api' })
    copy({ ...params, repo: 'cloud' })
    copyDependencies({ ...params, processType: 'api' })

}
/*
function CopyNodeApiBuildScript() {
    export Dependency = '$Dependency'
    export DependencyBase = '$DependencyBase'
    export RunnableModule = '$RunnableModule'
    export DependencyOrgOrRep = '$DependencyOrgOrRep'
    export Directories = '$Directories'
    envsubst < /HolismHolding/Infra / Api / Prod / NodeBuildScript > /Build/Build
}

function RemoveNodeLocalSecrets() {
    echo "Removing local secrets"
    find. | grep LocalSecrets | xargs sudo rm - rf
}

function BuildNodeApi() {
    export PATH = "${PATH}"


    CopyDependencies Api
    Copy $Repository Common
    Copy $Repository $Process
    CopyNodeApiBuildScript

    RemoveGitDirectories
    RemoveNodeLocalSecrets

    envsubst < /HolismHolding/Docker / Files / Prod / NodeApi > $Containerfile
}

*/
