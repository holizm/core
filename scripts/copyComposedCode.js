import { info } from './logger.js'
import { createDirIfNotExists, getFileNameWithoutExtension, removeAndRecreateDir } from './os.js'
import { runOnTerminal, runOnTerminalAsync } from './terminal.js'

const copyTopLevelDirs = async params => {
    const {
        containerHome,
        containerName,
    } = params
    const containerCommand = `
        for dir in ${containerHome}/*; do
            if [ -d $dir ]; then
                echo $dir
            fi
        done | sort
    `
    const hostCommand = `docker exec ${containerName} bash -c '${containerCommand}'`
    const dirs = runOnTerminal(hostCommand, { splitLines: true })

    await Promise.all(dirs.map(async dir => {
        const name = getFileNameWithoutExtension(dir)
        if (name === 'packages') return
        info(name)
        await runOnTerminalAsync(`
            docker exec ${containerName} bash -c '
                cd "${containerHome}" &&
                tar --exclude="node_modules" -cf - "${name}"
            ' | tar -xf - -C /tmp/build
        `)
    }))
}

const copyPartModules = async params => {
    const {
        containerHome,
        containerName,
        process,
        repo,
    } = params
    const nodeModulesPath = `${containerHome}/${repo}/${process}/node_modules`
    const buildNodeModulesPath = `/tmp/build/${repo}/${process}/node_modules`
    const findPartModulesCommand = `
        for dir in ${nodeModulesPath}/*; do
            if [ -d "$dir" ]; then
                base=$(basename "$dir")
                if [ -f "$dir/part" ] || [ "$base" = "core" ]; then
                    echo "$dir"
                fi
            fi
        done
    `
    const partModulesHostCommand = `docker exec ${containerName} bash -c '${findPartModulesCommand}'`
    const partDirs = runOnTerminal(partModulesHostCommand, { splitLines: true })

    createDirIfNotExists(buildNodeModulesPath)

    await Promise.all(partDirs.map(async dir => {
        const name = getFileNameWithoutExtension(dir)
        info(name)
        await runOnTerminalAsync(`
            docker exec ${containerName} bash -c '
                cd "${nodeModulesPath}" &&
                tar -cf - "${name}"
            ' | tar -xf - -C ${buildNodeModulesPath}
        `)
    }))
}

export default async params => {
    removeAndRecreateDir('/tmp/build')
    await copyTopLevelDirs(params)
    await copyPartModules(params)
}
