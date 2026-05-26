import { info } from './logger.js'
import { removeAndRecreateDir } from './os.js'
import { runOnTerminal } from './terminal.js'

export default params => {
    const {
        container,
        containerHome,
    } = params
    removeAndRecreateDir('/tmp/build')
    const command = `
        for dir in ${containerHome}/*; do
            if [ -d $dir ]; then
                echo $dir
            fi
        done
    `
    const dirs = runOnTerminal(`docker exec ${container} bash -c '${command}'`)
    for (const dir of dirs) {
        info(dir)
        runOnTerminal(`docker cp $container:$repo '/tmp/build/$name'`)
    }
    runOnTerminal(`docker cp $container:$containerHome/spl /tmp/build/spl || true`)
}
