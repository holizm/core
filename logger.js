export const getStack = () => {
    const stack = new Error()
        .stack
        .split("\n")
        .filter(i => !/^.*(\.vite|keycloak|\.main\.jsx).*/.test(i))
    return stack
}

const formatError = (err) => {
    const { name = "Error", message = "", stack = "", ...rest } = err
    const stackLines = stack.split("\n")
    stackLines[0] = `${name}: ${message}`
    let out = stackLines.join("\n")
    const extraKeys = Object.keys(rest)
    if (extraKeys.length > 0) {
        const extras = {}
        for (const key of extraKeys) {
            extras[key] = rest[key]
        }
        out += `\nExtra: ${JSON.stringify(extras, null, 4)}`
    }
    return out
}

const log = (color, ...args) => {
    const stack = getStack()
    const colorCodeStart = color
    const colorCodeReset = '\x1b[0m'
    const message = args.map(arg => {
        if (arg instanceof Error) {
            return formatError(arg)
        } else if (typeof arg === "object") {
            return JSON.stringify(arg, null, 4)
        } else {
            return String(arg)
        }
    }).join(" ")
    console.log(`${colorCodeStart}${message}${colorCodeReset}`)
}

export const success = (...args) => {
    log('\x1b[32m', ...args)
}

export const info = (...args) => {
    log('\x1b[36m', ...args)
}

export const warning = (...args) => {
    log('\x1b[33m', ...args)
}

export const error = (...args) => {
    log('\x1b[31m', ...args)
}

export const check = (...args) => {
    const checkMark = "\u2714"
    log('\x1b[32m', ...args, checkMark)
}

export const divide = () => {
    console.log()
    console.log('\x1b[35m----------\x1b[0m')
    console.log()
}

export const dividedError = (...args) => {
    divide()
    error(...args)
    divide()
}
