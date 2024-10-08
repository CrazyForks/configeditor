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

  const onSaveBtnClick = () => {
    console.log('Saving config:', nowFilePath, textContent)
  }

  const onRefreshBtnClick = () => {
    console.log('Refreshing config:', nowFilePath)
  }

  const onCopyBtnClick = async (filePath: string) => {
    if (filePath) {
      try {
        await navigator.clipboard.writeText(filePath)
        setIsPathCopied(true)
        setTimeout(() => setIsPathCopied(false), 2000)
      } catch (err) {
        alert('Failed to copy: Please try again')
      }
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 text-sm font-sans">
      <FileSidebar />
      {/* Right Content Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Top Management Bar */}
        <div className="bg-white shadow-sm p-4 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center flex-1">
            <h1 className="text-lg font-semibold truncate max-w-[50%] text-gray-700">
              {nowFilePath || '选择一个配置文件'}
            </h1>
            {nowFilePath && (
              <Button
                onClick={() => onCopyBtnClick(nowFilePath)}
                size="sm"
                variant="ghost"
                className="text-gray-500 hover:text-gray-700"
              >
                {isPathCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            )}
          </div>
          <div>
            <Button
              onClick={onSaveBtnClick}
              size="sm"
              className="mr-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
            >
              <Save className="mr-1 h-4 w-4" />
              保存
            </Button>
            <Button
              onClick={onRefreshBtnClick}
              size="sm"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              刷新
            </Button>
            <Button size="sm" variant="ghost" className="text-gray-500 hover:text-gray-700 ml-2">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

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
