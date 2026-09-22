import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import {
    getFromCacheOrApi,
    getThemeNumber,
    useAsync,
} from 'core'
import { getValues } from 'contents'
import { getGlobalization } from 'globalization'
import themeIndexes from '../themeIndexes'

const getData = routeLoader$(async props => {
    const [
        globalization,
        page,
        tenant,
    ] = await useAsync([
        getGlobalization(props),
        getValues('shared_shared_contents_page_home', props),
        getFromCacheOrApi('/tenant', props),
    ])
    const data = {
        ...page,
        globalization,
        theme: tenant?.theme,
    }
    return data
})

export default component$(() => {
    const data = getData().value
    const theme = getThemeNumber(data?.theme)
    const ThemeIndex = themeIndexes[theme]
    if (!ThemeIndex) return null
    return <ThemeIndex {...data} />
})
