import fg from 'fast-glob'

export default (processDirectory, home) => {
    const dependencyDirectory = `${processDirectory}/node_modules`
    const parts = fg.sync('*/part', {
        cwd: dependencyDirectory,
        onlyFiles: true,
    }).map(file => file.split('/')[0])
    const files = fg.sync(parts.map(part => `${home}/${part}/api/data/**/*.json`), {
        absolute: true,
        cwd: dependencyDirectory,
        onlyFiles: true,
    }).sort()
    return files
}
