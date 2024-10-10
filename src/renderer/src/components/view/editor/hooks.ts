import { fileInfosAtom, filePathsAtom } from "@/lib/store"
import { useAtom } from "jotai"
import { useEffect, useMemo } from "react"
import { isSubstr } from "./utils"

export function useInit() {
    const [, setFileInfos] = useAtom(fileInfosAtom)

    useEffect(() => {
        const localStorageFiles = localStorage.getItem('filePaths')
        if (localStorageFiles) {
            setFileInfos(JSON.parse(localStorageFiles))
        }
    }, [])
}

export function useFilePathSearch(searchName: string) {
    const [filePaths] = useAtom(filePathsAtom)

    const searchResults = useMemo(() => {
        let res: string[] = []
        if (searchName.trim().length === 0) {
            res = filePaths
        } else {
            for (const filePath of filePaths) {
                if (isSubstr(filePath.trim(), searchName.trim())) {
                    res.push(filePath)
                }
            }
        }
        return res;
    }, [searchName, filePaths])

    return searchResults
}
