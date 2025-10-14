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
    // console.log(stack)
    const colorCodeStart = color
    const colorCodeReset = '\x1b[0m'
    const timestamp = new Date().toISOString()
    const message = args.map(arg => {
        if (arg instanceof Error) {
            return formatError(arg)
        } else if (typeof arg === "object") {
            return JSON.stringify(arg, null, 4)
        } else {
            return String(arg)
        }
    }).join(" ")
    console.log(`${colorCodeStart}${timestamp} ${message}${colorCodeReset}`)
}

export const success = (...args) => {
    log('\x1b[32m', ...args)
}

export const info = (...args) => {
    log('\x1b[34m', ...args)
}

export const warning = (...args) => {
    log('\x1b[33m', ...args)
}

export const error = (...args) => {
    log('\x1b[31m', ...args)
}
