import {
    isFile,
    writeFile,
} from "./os.js"

export default params => {
    const {
        repo,
        tenantsPath,
    } = params

    if (!isFile(tenantsPath)) {
        writeFile(tenantsPath, `${repo} ${repo}.com zh,es,en,hi,pt,bn,ru,ja,vi,tr,ko,fr,ta,ar,de,ur,it,fa en\n`)
    }
}
