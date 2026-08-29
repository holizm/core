import fs from 'fs'
import { recordMetric } from './timing.js'

export default params => {
    const snapshotPath = `/tmp/${params.repo}/${params.process}/ownershipSnapshots.json`
    if (!fs.existsSync(snapshotPath)) {
        return
    }
    const snapshots = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))
    for (const snapshot of snapshots) {
        const paths = snapshot.newRootOwnedPaths || []
        recordMetric(`New root-owned paths after ${snapshot.phase}`, paths.length)
        if (paths.length > 0) {
            recordMetric(`Paths created after ${snapshot.phase}`, paths.join('\n'))
        }
    }
}
