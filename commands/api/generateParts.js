import { availableParallelism } from 'node:os'
import { info } from '../../scripts/logger.js'

const getElapsedSeconds = startedAt =>
    (Number(process.hrtime.bigint() - startedAt) / 1e9).toFixed(1)

export default async (parts, generatePart) => {
    const uniqueParts = Array.from(new Set(parts))
    const workerCount = Math.min(availableParallelism(), uniqueParts.length)
    const roundCount = Math.ceil(uniqueParts.length / workerCount)
    const startedAt = process.hrtime.bigint()
    let completedCount = 0

    for (let roundIndex = 0; roundIndex < roundCount; roundIndex++) {
        const roundParts = uniqueParts.slice(completedCount, completedCount + workerCount)
        const remainingCount = uniqueParts.length - completedCount
        const roundStartedAt = process.hrtime.bigint()

        info(`Generation round ${roundIndex + 1}/${roundCount}; done ${completedCount}; remaining ${remainingCount}; parallel ${roundParts.length}; elapsed ${getElapsedSeconds(startedAt)}s`)
        await Promise.all(roundParts.map(generatePart))
        completedCount += roundParts.length
        info(`Generation round ${roundIndex + 1}/${roundCount} finished in ${getElapsedSeconds(roundStartedAt)}s`)
    }

    info(`Generation finished; done ${completedCount}; remaining 0; elapsed ${getElapsedSeconds(startedAt)}s`)
}
