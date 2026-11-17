import isDir from './isDir.js'

export default params => {
    const {
        containerHome,
        home,
        process,
        processPath,
        repo,
    } = params
    const targetBase = `${containerHome}/${repo}/${process}/src`
    const mappings = {
        form: 'components/form',
        list: 'components/list',
        panel: 'panel',
        svg: 'svg',
    }
    for (const [source, target] of Object.entries(mappings)) {
        const sourcePath = `${processPath}/${source}`
        if (isDir(sourcePath)) {
            params.addVolume(sourcePath, `${targetBase}/${target}`)
        }
    }
    params.addVolume(`${home}/complexPanel/src/components/image.jsx`, `${targetBase}/components/image.jsx`)
}
