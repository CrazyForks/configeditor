'use client'

import { Button } from '@/components/ui/button'
import { filePathsAtom, nowFileNameAtom, nowFilePathAtom } from '@/lib/store'
import { useAtom } from 'jotai'
import { Check, Copy, RefreshCw, Save, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FileSidebar } from './file-sidebar'
import Editor, { DiffEditor, useMonaco, loader } from '@monaco-editor/react'
const { ipcRenderer } = window.require('electron')
import * as monaco from "monaco-editor"
import { EditorHeadBar } from './editor-headbar'
loader.config({ monaco });

export default function ConfigEditor() {
  const [, setFilePaths] = useAtom(filePathsAtom)
  const [nowFilePath] = useAtom(nowFilePathAtom)
  const [textContent, setTextContent] = useState<string>('')
  const [isPathCopied, setIsPathCopied] = useState(false)

  useEffect(() => {
    const localStorageFiles = localStorage.getItem('filePaths')
    if (localStorageFiles) {
      setFilePaths(JSON.parse(localStorageFiles))
    }
  }, [])

  useEffect(() => {
    if (nowFilePath) {
      ipcRenderer.invoke('read-file-content', { filePath: nowFilePath }).then((arg) => {
        if (typeof arg?.content === 'string') {
          setTextContent(arg.content)
        } else {
          setTextContent('')
        }
      })
    }
  }, [nowFilePath])

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 text-sm font-sans">
      <FileSidebar />
      {/* Right Content Area */}
      <div className="flex-1 flex flex-col bg-white">
        <EditorHeadBar />
        {/* Text Editor */}
        {nowFilePath ? (
          <>
            <div className="flex-1 bg-gray-50 flex">
              <Editor
                defaultLanguage=""
                defaultValue=""
                value={textContent}
                language='bash'
                options={{
                  fontSize: 14 // 设置字号为14px
                }}
              />
            </div>
          </>
        ) : (
          <>
            {/* 一些帮助信息 */}
          </>
        )}
      </div>
    </div>
  )
}
