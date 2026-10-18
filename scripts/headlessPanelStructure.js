export default {
    form: {
        'form.jsx': '',
    },
    headless: '',
    list: {
        'list.jsx': '',
    },
    panel: {
        'darkLight.jsx': '',
        'error.jsx': '',
        'initial.css': '',
        'layout.jsx': '',
        'loader.html': '',
        'menu.jsx': `import { NavLink } from 'react-router'
import { t } from 'app'
import menu from '../menu.jsx'

export default () => <nav>
    {
        menu.map(item => <NavLink
            end
            key={item.path}
            to={item.path}
        >
            {
                t(item.title)
            }
        </NavLink>)
    }
</nav>
`,
        'notFound.jsx': '',
        'unauthorized.jsx': '',
    },
    svg: {
        'dark.jsx': '',
        'light.jsx': '',
    },
}
