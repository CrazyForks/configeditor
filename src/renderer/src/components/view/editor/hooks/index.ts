import { appSettingsAtom, fileInfosAtom, filePathsAtom } from '@/components/view/editor/store'
import { useAtom } from "jotai"
import { useEffect, useMemo } from "react"
import { isSubstr, readAppSettings, readFileInfos } from "../utils"

export function useInitConfigEditor() {
    const [appSettings, setAppSettings] = useAtom(appSettingsAtom)
    const [, setFileInfos] = useAtom(fileInfosAtom)

    useEffect(() => {
        const localFileInfos = readFileInfos()
        setFileInfos(localFileInfos)
        const localAppSettings = readAppSettings()
        setAppSettings(localAppSettings)
    }, [])
}

export function useShowFilePaths(searchName: string) {
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
