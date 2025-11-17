import { DefaultBreadcrumb } from 'core'

export default ({ breadcrumb }) => {

    return <div class="w-full">
        <DefaultBreadcrumb
            breadcrumb={breadcrumb}
            itemClass="hover:scale-125"
            separator={<span> :: </span>}
            wrapperClass="w-full"
        />
    </div>
}
