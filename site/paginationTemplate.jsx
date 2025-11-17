import { Pagination as BasePagination } from "base"

export default ({ metadata }) => {

    return <div>
        <BasePagination
            activeClass="bg-slate-800 text-white"
            container="flex flex-wrap gap-2 max-w-7xl mx-auto px-6 mt-5 mb-20"
            ellipses
            first="w-10 aspect-square p-1 sm:p-2"
            items="flex items-center justify-center w-8 sm:w-10 aspect-square border-2 rounded-lg text-xs sm:text-base hover transition-all"
            last="w-10 aspect-square p-1 sm:p-2"
            metadata={metadata}
            next="w-10 aspect-square p-1 sm:p-2"
            previous="w-10 aspect-square p-1 sm:p-2"
        />
    </div>
}
