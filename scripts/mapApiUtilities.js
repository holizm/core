import fs from 'fs'
import path from 'path'

export default params => {
    const {
        commonPath,
        containerHome,
        home,
        process,
        repo,
    } = params
    if (!process.startsWith('admin')) {
        return
    }
    const mappings = [
        [`${home}/etl`, `${containerHome}/etl`],
        [`${home}/generation/common`, `${containerHome}/generation/common`],
        [`${home}/generation/database`, `${containerHome}/generation/database`],
        [`${home}/generation/order`, `${containerHome}/generation/order`],
        [`${home}/generation/process.js`, `${containerHome}/generation/process.js`],
        [`${home}/migration/adHoc`, `${containerHome}/migration/adHoc`],
        [`${home}/migration/environment.js`, `${containerHome}/migration/environment.js`],
        [`${home}/migration/migrators`, `${containerHome}/migration/migrators`],
        [`${home}/migration/process.js`, `${containerHome}/migration/process.js`],
        [`${home}/query/partDropper.js`, `${containerHome}/query/partDropper.js`],
        [`${home}/query/process.js`, `${containerHome}/query/process.js`],
        [`${home}/toMongo/importers`, `${containerHome}/toMongo/importers`],
        [`${home}/toMongo/process.js`, `${containerHome}/toMongo/process.js`],
        [`${home}/etl`, `${containerHome}/toMongo/etl`],
    ]
    for (const [source, target] of mappings) {
        params.addVolume(source, target)
    }
    const etlPath = path.join(`${home}/${repo}/etl`)
    if (fs.existsSync(etlPath)) {
        for (const child of fs.readdirSync(etlPath)) {
            const childPath = path.join(etlPath, child)
            if (fs.statSync(childPath).isDirectory()) {
                params.addVolume(childPath, `${containerHome}/toMongo/runnableImporters/${child}`)
            }
        }
    }
    if (fs.existsSync(`${commonPath}/migration`)) {
        params.addVolume(`${commonPath}/migration`, `${containerHome}/migration/runnable`)
    }
}
