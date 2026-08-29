import fs from 'fs'
import path from 'path'

const getDurationMilliseconds = startedAt => Number(process.hrtime.bigint() - startedAt) / 1e6

export const initializeTimings = () => {
    globalThis.timings = []
}

export const recordTiming = (task, durationMilliseconds) => {
    if (!Array.isArray(globalThis.timings)) {
        return
    }
    globalThis.timings.push({
        durationMilliseconds,
        task,
    })
}

export const measure = (task, callback) => {
    const startedAt = process.hrtime.bigint()
    try {
        return callback()
    }
    finally {
        recordTiming(task, getDurationMilliseconds(startedAt))
    }
}

export const measureAsync = async (task, callback) => {
    const startedAt = process.hrtime.bigint()
    try {
        return await callback()
    }
    finally {
        recordTiming(task, getDurationMilliseconds(startedAt))
    }
}

const escapeCell = value => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ')

export const writeTimings = outputPath => {
    const timings = globalThis.timings || []
    const sortedTimings = [...timings].sort((a, b) => b.durationMilliseconds - a.durationMilliseconds)
    const rows = sortedTimings.map(timing => `| ${escapeCell(timing.task)} | ${timing.durationMilliseconds.toFixed(3)} |`)
    const content = [
        '| Task | Duration (ms) |',
        '| --- | ---: |',
        ...rows,
        '',
    ].join('\n')
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, content)
    return outputPath
}
