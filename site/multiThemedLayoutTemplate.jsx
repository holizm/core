import {
    component$,
    Slot,
} from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import {
    getFromCacheOrApi,
    getThemeNumber,
    SiteFooter,
    SiteHeader,
    useAsync,
} from 'core'
import { getValues } from 'contents'
import { getGlobalization } from 'globalization'
import { getMenu } from 'navigation'
import { useLayoutSeo } from 'seo'
import { getApplicationSettings } from 'settings'
import themeLayouts from '../themeLayouts'

const getData = routeLoader$(async props => {
    const [
        applicationSettings,
        globalization,
        layout,
        menu,
        tenant,
    ] = await useAsync([
        getApplicationSettings(props),
        getGlobalization(props),
        getValues('shared_shared_contents_layout_main', props),
        getMenu(props),
        getFromCacheOrApi('/tenant', props),
    ])
    const data = {
        ...layout,
        ...globalization,
        ...menu,
        ...applicationSettings,
        theme: tenant?.theme,
    }
    return data
})

const Layout = component$(() => {
    const data = getData().value
    const theme = getThemeNumber(data?.theme)
    const ThemeLayout = themeLayouts[theme]
    if (ThemeLayout) return <ThemeLayout {...data}>
        <Slot />
    </ThemeLayout>
    if (!theme) return null
    const direction = data?.isRtl
        ?
        'rtl'
        :
        'ltr'
    return <div
        class={`themeRoot theme${theme.padStart(3, '0')} flex min-h-screen flex-col justify-between`}
        dir={direction}
    >
        <SiteHeader {...data} />
        <main class='flex-1'>
            <Slot />
        </main>
        <SiteFooter {...data} />
    </div>
})

export default Layout

export const head = ({ resolveValue }) => useLayoutSeo(getData, resolveValue)
