const timers = {}

export const startTimer = name => {
    timers[name] = process.hrtime.bigint()
}

export const stopTimer = name => {
    if (!timers[name]) return null
    const diff = Number(process.hrtime.bigint() - timers[name]) / 1e9
    delete timers[name]
    return diff.toFixed(3)
}
