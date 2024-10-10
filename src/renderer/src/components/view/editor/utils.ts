import { filePathsAtom } from '@/lib/store';
import { useAtom } from 'jotai';
import { useMemo } from 'react'
const { ipcRenderer } = window.require('electron')

export function isSubstr(str: string, sub: string) {
  let res = false;
  let i = 0;
  let j = 0;
  if (str.length === 0 || sub.length === 0) {
    res = false;
  }
  while (i < str.length && j < sub.length) {
    if (str[i] === sub[j]) {
      i += 1;
      j += 1;
    } else {
      i += 1;
    }
  }
  if (j === sub.length) { 
    res = true;
  }
  return res;
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
