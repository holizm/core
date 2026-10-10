import {
    component$,
    Resource,
    Slot,
    useResource$,
} from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import getFromCacheOrApi from 'getFromCacheOrApi'
import getThemeNumber from 'getThemeNumber'
import SiteFooter from 'siteFooter'
import SiteHeader from 'siteHeader'
import useAsync from 'useAsync'
import contentsGetValues from 'contentsGetValues'
import globalizationGetGlobalization from 'globalizationGetGlobalization'
import navigationGetMenu from 'navigationGetMenu'
import seoUseLayoutSeo from 'seoUseLayoutSeo'
import settingsGetApplicationSettings from 'settingsGetApplicationSettings'
import themeLayouts from 'themeLayouts'

const getData = routeLoader$(async props => {
    const [
        applicationSettings,
        globalization,
        layout,
        menu,
        tenant,
    ] = await useAsync([
        settingsGetApplicationSettings(props),
        globalizationGetGlobalization(props),
        contentsGetValues('shared_shared_contents_layout_main', props),
        navigationGetMenu(props),
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
    const dataSignal = getData()
    const data = dataSignal.value
    const theme = getThemeNumber(data?.theme)
    const themeModule = useResource$(async ({ track }) => {
        const selectedTheme = getThemeNumber(track(() => dataSignal.value?.theme))
        const load = themeLayouts[selectedTheme]
        const module = load ? await load() : null
        return module
    })
    if (!theme) return null
    const direction = data?.isRtl
        ?
        'rtl'
        :
        'ltr'
    const fallback = <div
        class={`themeRoot theme${theme.padStart(3, '0')} flex min-h-screen flex-col justify-between`}
        dir={direction}
    >
        <SiteHeader {...data} />
        <main class='flex-1'>
            <Slot />
        </main>
        <SiteFooter {...data} />
    </div>
    return <Resource
        value={themeModule}
        onResolved={module => {
            const ThemeLayout = module?.default
            return ThemeLayout ? <ThemeLayout {...data}><Slot /></ThemeLayout> : fallback
        }}
        onRejected={() => fallback}
    />
})

export default Layout

export const head = ({ resolveValue }) => seoUseLayoutSeo(getData, resolveValue)
