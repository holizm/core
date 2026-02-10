import copyDependencies from './copyDependencies.js'
import copy from './copy.js'

const copyBuildScript = params => {

}

export default params => {
    copy({ ...params, directory: 'core' })
    copy({ ...params, directory: 'fonts' })
    copy({ ...params, directory: 'api' })
    copy({ ...params, directory: 'cloud' })
    copyDependencies({ ...params, processType: 'api' })
    copy({ ...params, directory: params.repo })

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

    CopyNodeApiBuildScript

    RemoveGitDirectories
    RemoveNodeLocalSecrets

    envsubst < /HolismHolding/Docker / Files / Prod / NodeApi > $Containerfile
}

*/
