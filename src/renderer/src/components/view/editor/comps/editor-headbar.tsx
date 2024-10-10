'use client'

import { Button } from '@/components/ui/button'
import { isEditingAtom, newTextContentAtom, nowFileInfoAtom, nowFilePathAtom } from '@/lib/store'
import { useAtom } from 'jotai'
import { Check, Copy, RefreshCw, Save, Settings } from 'lucide-react'
import { useState } from 'react'
import SettingsDialog from './settings-dialog'
const { ipcRenderer } = window.require('electron')

export function EditorHeadBar() {
  const [nowFileInfo] = useAtom(nowFileInfoAtom)
  const [nowFilePath] = useAtom(nowFilePathAtom)
  const [isEditing] = useAtom(isEditingAtom);
  const [isPathCopied, setIsPathCopied] = useState(false)
  const [isSettingDialogOpen, setIsSettingDialogOpen] = useState(false)
  const [newTextContent] = useAtom(newTextContentAtom)

  const onSaveBtnClick = () => {
    if (isEditing) {
      // 文件已编辑过
      ipcRenderer.invoke('is-file-write', { filePath: nowFilePath }).then((arg) => {
        // 判断文件是否可写
        const { code, msg } = arg ?? {}
        if (code === 3) {
          // 可写
          ipcRenderer.invoke('write-file', { filePath: nowFilePath, content: newTextContent }).then((res) => {
            // 写入文件成功，处理当前数据
          })
        } else if (code === 2) {
          // 不可写(读取文件出错或文件不可写)
          alert('Save failed: ' + msg)
        }
      })
    }
  }

  const onRefreshBtnClick = () => {
    console.log('Refreshing config:', nowFilePath)
    if (nowFileInfo?.refreshCmd) {
      // TODO
    }
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
          {isEditing && <span style={{ color: 'red' }}>*</span>}{nowFilePath || '选择一个配置文件'}
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
      <div className='whitespace-nowrap'>
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
        <Button onClick={() => setIsSettingDialogOpen(true)} size="sm" variant="ghost" className="text-gray-500 hover:text-gray-700 ml-2">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
    <SettingsDialog isSettingDialogOpen={isSettingDialogOpen} setIsSettingDialogOpen={setIsSettingDialogOpen} />
  </>
}