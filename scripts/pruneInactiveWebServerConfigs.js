import fs from 'fs'
import path from 'path'

const getDirectories = directory => fs.existsSync(directory)
    ? fs.readdirSync(directory, { withFileTypes: true }).filter(entry => entry.isDirectory())
    : []

export default ({
    activeContainers,
    home,
    keepContainerName,
    root,
}) => {
    const active = new Set(activeContainers)
    if (keepContainerName) active.add(keepContainerName)
    const processes = []
    const activeConfigs = new Set()
    let removed = 0

    for (const repository of getDirectories(home)) {
        if (!fs.existsSync(path.join(home, repository.name, '.git'))) continue
        const repositoryPath = path.join(root, repository.name)
        for (const process of getDirectories(repositoryPath)) {
            const processPath = path.join(repositoryPath, process.name)
            const composePath = path.join(processPath, 'compose.yaml')
            if (!fs.existsSync(composePath)) continue
            const compose = fs.readFileSync(composePath, 'utf8')
            const containerName = compose.match(/^\s*container_name:\s*['"]?([^\s'"#]+)/m)?.[1]
            if (!containerName) continue
            const webServerPath = path.join(processPath, 'webServer')
            const confDir = path.join(webServerPath, 'conf.d')
            if (!fs.existsSync(confDir)) continue
            const files = fs.readdirSync(confDir).filter(file => file.endsWith('.conf'))
            const configuration = {
                confDir,
                containerName,
                files,
                includesDir: path.join(webServerPath, 'includes'),
            }
            processes.push(configuration)
            if (active.has(containerName)) {
                for (const file of files) activeConfigs.add(file)
            }
        }
    }

    for (const configuration of processes) {
        const {
            confDir,
            containerName,
            files,
            includesDir,
        } = configuration
        if (active.has(containerName)) continue
        for (const file of files) {
            if (!activeConfigs.has(file)) continue
            fs.rmSync(path.join(confDir, file), { force: true })
            fs.rmSync(path.join(includesDir, path.basename(file, '.conf')), { force: true })
        }
        if (fs.readdirSync(confDir).length) continue
        fs.rmSync(confDir, { force: true, recursive: true })
        fs.rmSync(includesDir, { force: true, recursive: true })
        removed++
    }

    return removed
}
