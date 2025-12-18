import { component$ } from "builder.io/qwik"
import { routeLoader$ } from "builder.io/qwik-city"

const getData = routeLoader$(async props => {

})

export default component$(() => {

    const data = getData().value

    return <div class="text-red-400">Home</div>
})
