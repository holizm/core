import isFile from './isFile.js'
import { errorAndExit } from './logger.js'
import {
    getContent,
    writeFile,
} from './os.js'

export default params => {
    const {
        home,
        isControl,
        isControlProcess,
        repo,
        tenantsPath,
    } = params

    if (isControl && !isControlProcess) {
        errorAndExit('Control runnables support tenants only in controlApi and controlPanel')
    }
    if (isControlProcess) {
        const tenant = repo.replace(/Control$/, '')
        const backingTenantsPath = `${home}/${tenant}/common/tenants`
        const backingTenant = isFile(backingTenantsPath)
            ?
            getContent(backingTenantsPath)
                .split('\n')
                .map(line => line.trim())
                .find(line => line && !line.startsWith('#') && line.split(/\s+/)[0] === tenant)
            :
            null
        const domain = backingTenant?.split(/\s+/)[1] || `${tenant.toLowerCase()}.com`
        writeFile(tenantsPath, `${tenant} ${domain} en en control\n`)
        return
    }
    if (!isFile(tenantsPath)) {
        writeFile(tenantsPath, `${repo} ${repo}.com zh,es,en,hi,pt,bn,ru,ja,vi,tr,ko,fr,ta,ar,de,ur,it,fa en\n`)
    }
}
