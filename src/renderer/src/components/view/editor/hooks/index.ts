import { appSettingsAtom, fileInfosAtom, filePathsAtom, initThemeAtom } from '@/components/view/editor/store'
import { useAtom } from "jotai"
import { useEffect, useMemo } from "react"
import { isSubstr, readAppSettings, readFileInfos } from "../utils"

export function useInitConfigEditor() {
    const [, setAppSettings] = useAtom(appSettingsAtom)
    const [, setFileInfos] = useAtom(fileInfosAtom)
    const [, initTheme] = useAtom(initThemeAtom)

    useEffect(() => {
        const localFileInfos = readFileInfos()
        setFileInfos(localFileInfos)
        const localAppSettings = readAppSettings()
        setAppSettings(localAppSettings)
        // 初始化主题
        initTheme()
    }, [setFileInfos, setAppSettings, initTheme])
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
