import { availableParallelism } from 'node:os'

export default async (parts, migratePart) => {
    const workerCount = Math.min(availableParallelism(), parts.length)

    for (let partIndex = 0; partIndex < parts.length; partIndex += workerCount) {
        const roundParts = parts.slice(partIndex, partIndex + workerCount)
        await Promise.all(roundParts.map(migratePart))
    }
}
