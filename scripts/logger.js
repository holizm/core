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

const log = (color, toStderr, ...args) => {
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

    const output = `${colorCodeStart}${message}${colorCodeReset}`
    if (toStderr) {
        console.error(output)
    } else {
        console.log(output)
    }
}

export const success = (...args) => {
    log('\x1b[32m', false, ...args)
}

export const info = (...args) => {
    log('\x1b[36m', false, ...args)
}

export const warning = (...args) => {
    log('\x1b[33m', false, ...args)
}

export const error = (...args) => {
    log('\x1b[31m', true, ...args)
}

export const errorAndExit = (...args) => {
    dividedError(...args)
    process.exit(1)
}

export const check = (...args) => {
    const checkMark = "\u2714"
    log('\x1b[32m', false, ...args, checkMark)
}

export const divide = (toStderr) => {
    const func = toStderr ? console.error : console.log
    func()
    func('\x1b[35m----------\x1b[0m')
    func()
}

export const dividedError = (...args) => {
    divide(true)
    error(...args)
    divide(true)
}
