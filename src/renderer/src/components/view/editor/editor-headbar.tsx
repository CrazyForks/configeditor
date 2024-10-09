'use client'

import { Button } from '@/components/ui/button'
import { filePathsAtom, nowFileNameAtom, nowFilePathAtom } from '@/lib/store'
import { useAtom } from 'jotai'
import { Check, Copy, RefreshCw, Save, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FileSidebar } from './file-sidebar'
import Editor, { DiffEditor, useMonaco, loader } from '@monaco-editor/react'

export function EditorHeadBar () {
    const [, setFilePaths] = useAtom(filePathsAtom)
    const [nowFilePath] = useAtom(nowFilePathAtom)
    const [isPathCopied, setIsPathCopied] = useState(false)

  const onSaveBtnClick = () => {
    console.log('Saving config:', nowFilePath)
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

    return <>
        {/* Top Management Bar */}
        <div className="bg-white shadow-sm p-4 pr-2 flex justify-between items-center border-b border-gray-200">
            <div className="flex items-center flex-1">
                <h1 className="text-lg font-semibold truncate max-w-[100%] text-gray-700">
                    <span style={{ color: 'red' }}>*</span>{nowFilePath || '选择一个配置文件'}
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

    </>
}