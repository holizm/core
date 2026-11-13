import { writeFile } from './os.js'

export default ({
    directory,
    theme,
}) => writeFile(`${directory}/${theme}.jsx`, `import { component$ } from '@builder.io/qwik'

export default component$(async props => {
    const module = await import('../themes/${theme}/pages/index')
    const Index = module.default
    return <Index {...props} />
})
`)
