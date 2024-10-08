import MiniSearch from 'minisearch'
import { useMemo } from 'react'

export function useFilePathSearch(filePaths: string[], searchName: string) {
  const minisearch = useMemo(() => {
    const searchInstance = new MiniSearch({
      fields: ['content'],
      storeFields: ['content']
    })
    searchInstance.addAll(filePaths.map((path, i) => ({ id: i, content: path })))
    return searchInstance
  }, [filePaths])

  const searchResults = useMemo(() => {
    if (!searchName.trim().length) {
      return filePaths
    } else {
      const res = minisearch.search(searchName)
      return res.map((item) => item.content)
    }
  }, [minisearch, searchName, filePaths])

  return searchResults
}
