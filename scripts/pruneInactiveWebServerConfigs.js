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
            if (!containerName || active.has(containerName)) continue

            const webServerPath = path.join(processPath, 'webServer')
            const confDir = path.join(webServerPath, 'conf.d')
            if (!fs.existsSync(confDir)) continue
            fs.rmSync(confDir, { force: true, recursive: true })
            fs.rmSync(path.join(webServerPath, 'includes'), { force: true, recursive: true })
            removed++
        }
    }

    return removed
}
