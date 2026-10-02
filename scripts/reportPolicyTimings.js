import { writeFileSync } from 'fs'

export default fileTimings => {
    const totals = new Map()
    for (const timings of fileTimings) {
        for (const timing of timings) {
            const current = totals.get(timing.task) || { count: 0, total: 0 }
            current.count++
            current.total += timing.durationMilliseconds
            totals.set(timing.task, current)
        }
    }
    const rows = [...totals].sort((a, b) => b[1].total - a[1].total)
    const lines = [
        '| Task | Total (ms) | Calls | Average (ms) |',
        '| --- | ---: | ---: | ---: |',
    ]
    for (const [task, timing] of rows) {
        lines.push(`| ${task} | ${timing.total.toFixed(3)} | ${timing.count} | ${(timing.total / timing.count).toFixed(3)} |`)
    }
    writeFileSync('/tmp/checkPolicyTimings.md', `${lines.join('\n')}\n`)
}
