import fs from 'fs'
import path from 'path'

const getDurationMilliseconds = startedAt => Number(process.hrtime.bigint() - startedAt) / 1e6

export const initializeTimings = () => {
    globalThis.timingMetrics = []
    globalThis.timings = []
}

export const recordMetric = (metric, value) => {
    if (!Array.isArray(globalThis.timingMetrics)) {
        return
    }
    globalThis.timingMetrics.push({
        metric,
        value,
    })
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

const escapeCell = value => String(value).replaceAll('|', '\\|').replaceAll('\n', '<br>')

export const writeTimings = outputPath => {
    const metrics = globalThis.timingMetrics || []
    const timings = globalThis.timings || []
    const sortedTimings = [...timings].sort((a, b) => b.durationMilliseconds - a.durationMilliseconds)
    const rows = sortedTimings.map(timing => `| ${escapeCell(timing.task)} | ${timing.durationMilliseconds.toFixed(3)} |`)
    const metricRows = metrics.map(metric => `| ${escapeCell(metric.metric)} | ${escapeCell(metric.value)} |`)
    const content = [
        '| Task | Duration (ms) |',
        '| --- | ---: |',
        ...rows,
        '',
        '| Metric | Value |',
        '| --- | ---: |',
        ...metricRows,
        '',
    ].join('\n')
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, content)
    return outputPath
}
