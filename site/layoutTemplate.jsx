import {
    component$,
    Slot,
} from "builder.io/qwik"
import { routeLoader$ } from "builder.io/qwikCity"

const getData = routeLoader$(async props => {

})

export default component$(() => {

    const data = getData().value

    return <>
        <Slot />
    </>
})
