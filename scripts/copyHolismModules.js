import { info } from './logger.js'
import {
    isDir,
    removeAndRecreateDir,
} from './os.js'
import { runOnTerminal } from './terminal.js'

export default params => {
    const {
        repo,
        process,
    } = params
    removeAndRecreateDir('/tmp/build/holismModulesInNodeModules')
    const nodeModulesDir = `/tmp/build/${repo}/${process}/node_modules`
    if (isDir(nodeModulesDir)) {
        const holismModules = runOnTerminal(`find ${nodeModulesDir} -type f -name export.js -not -path '*/*-*/*' | sort`)
        for (const holismModule in holismModules) {
            info(holismModule)
            // runOnTerminal(`cp -R ${parent} ${nodeModulesDir}/${name}`)
        }
    }
}
/*




if [ -d '/tmp/build/$repo/$process/node_modules' ]; then
    cd '/tmp/build/$repo/$process/node_modules'

    find  | while read file; do
        parent=$(dirname '$file')
        name=$(basename '$parent')

        cp -R '$parent' '/tmp/build/holismModulesInNodeModules/$name'
    done
    [ -d '/tmp/build/$repo/$process/node_modules/core' ] && cp -R '/tmp/build/$repo/$process/node_modules/core' '/tmp/build/holismModulesInNodeModules/core'
fi

*/
