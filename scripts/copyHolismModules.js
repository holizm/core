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
        const holismModules = [
            ...runOnTerminal(`find ${nodeModulesDir} -type f -name export.js -not -path '*/*-*/*' | sort`),
            'core',
        ]
        for (const holismModule in holismModules) {
            info(holismModule)
            // runOnTerminal(`cp -R ${parent} ${nodeModulesDir}/${name}`)
        }
    }
}
