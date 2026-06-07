import { info } from './logger.js'
import { getFileNameWithoutExtension, removeAndRecreateDir } from './os.js'
import { runOnTerminal } from './terminal.js'

export default params => {
    const {
        containerHome,
        containerName,
        repo,
    } = params

    removeAndRecreateDir('/tmp/build')

    const containerCommand = `
        for dir in ${containerHome}/*; do
            if [ -d $dir ]; then
                echo $dir
            fi
        done | sort
    `

    const hostCommand = `docker exec ${containerName} bash -c '${containerCommand}'`
    const dirs = runOnTerminal(hostCommand, { splitLines: true })

    for (const dir of dirs) {
        const name = getFileNameWithoutExtension(dir)

        if (name === 'packages') {
            continue
        }

        info(name)

        runOnTerminal(`
            docker exec ${containerName} bash -c '
                cd "${containerHome}" &&
                tar --exclude="node_modules" -cf - "${name}"
            ' | tar -xf - -C /tmp/build
        `)
    }

    const nodeModulesPath = `${containerHome}/node_modules`

    const findPartModulesCommand = `
        for dir in ${nodeModulesPath}/*; do
            if [ -d "$dir" ]; then
                if [ -f "$dir/part" ]; then
                    echo "$dir"
                fi
            fi
        done
    `

    const partModulesHostCommand = `docker exec ${containerName} bash -c '${findPartModulesCommand}'`
    const partDirs = runOnTerminal(partModulesHostCommand, { splitLines: true })

    for (const dir of partDirs) {
        const name = getFileNameWithoutExtension(dir)
        info(name)

        runOnTerminal(`
            docker exec ${containerName} bash -c '
                cd "${nodeModulesPath}" &&
                tar -cf - "${name}"
            ' | tar -xf - -C /tmp/build/node_modules
        `)
    }
}
