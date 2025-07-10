'use client'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { isEditingAtom, isSudoDialogOpenAtom, newTextContentAtom, nowFileInfoAtom, nowFilePathAtom, textContentAtom, sudoScenarioAtom, isSavingAtom, isRefreshingAtom, isLeftPanelOpenAtom, addDebugLogAtom, downloadProgressAtom, downloadSpeedAtom, downloadStatusAtom, isAIPanelOpenAtom } from '@/components/view/editor/store'
import { useAtom } from 'jotai'
import { RefreshCw, Save, Settings, Loader2, RotateCcw, ChevronRight, Bot } from 'lucide-react'
import { useState } from 'react'
import { toast } from "sonner"
import SettingsDialog from './settings-dialog'
import { SudoDialog } from './sudo-dialog'
const { ipcRenderer } = window.require('electron')

export function EditorHeadBar() {
  const [nowFileInfo] = useAtom(nowFileInfoAtom)
  const [nowFilePath] = useAtom(nowFilePathAtom)
  const [isEditing] = useAtom(isEditingAtom);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useAtom(isLeftPanelOpenAtom)
  const [isAIPanelOpen, setIsAIPanelOpen] = useAtom(isAIPanelOpenAtom)
  const [isPathCopied, setIsPathCopied] = useState(false)
  const [isSettingDialogOpen, setIsSettingDialogOpen] = useState(false)
  const [isReloadingFile, setIsReloadingFile] = useState(false)
  const [, setTextContent] = useAtom(textContentAtom)
  const [newTextContent, setNewTextContent] = useAtom(newTextContentAtom)
  const [, setIsSudoDialogOpen] = useAtom(isSudoDialogOpenAtom)
  const [, setSudoScenario] = useAtom(sudoScenarioAtom)
  const [isSaving, setIsSaving] = useAtom(isSavingAtom)
  const [isRefreshing, setIsRefreshing] = useAtom(isRefreshingAtom)
  const [, addDebugLog] = useAtom(addDebugLogAtom)
  const [, setDownloadProgress] = useAtom(downloadProgressAtom)
  const [, setDownloadSpeed] = useAtom(downloadSpeedAtom)
  const [, setDownloadStatus] = useAtom(downloadStatusAtom)

  const onShowLeftPanel = () => {
    setIsLeftPanelOpen(true)
  }

  // 根据错误信息判断需要哪种sudo权限
  const openSudoDialog = (errorMsg: string, isForCommand = false) => {
    if (isForCommand && (errorMsg.includes('systemctl') || errorMsg.includes('service') || errorMsg.includes('nginx') || errorMsg.includes('apache'))) {
      // 系统服务相关命令通常需要root密码
      setSudoScenario({
        type: 'root',
        description: '请输入root密码',
        purpose: 'command'
      })
    } else if (isForCommand) {
      // 其他命令操作
      setSudoScenario({
        type: 'user',
        description: '请输入你的登录密码',
        purpose: 'command'
      })
    } else {
      // 文件权限相关通常使用用户的sudo密码
      setSudoScenario({
        type: 'user',
        description: '请输入你的登录密码',
        purpose: 'file'
      })
    }
    setIsSudoDialogOpen(true)
  }

  const onSaveBtnClick = () => {
    return new Promise((resolve) => {
      if (isEditing && !isSaving) {
        setIsSaving(true)
        addDebugLog(`开始保存文件: ${nowFilePath}`, 'info')

        // 文件已编辑过
        if (nowFileInfo?.remoteInfo) {
          // 远程文件保存
          addDebugLog(`执行远程文件保存: ${nowFileInfo.remoteInfo.host}:${nowFileInfo.remoteInfo.port}`, 'info')
          ipcRenderer.invoke('write-remote-file', {
            filePath: nowFilePath,
            content: newTextContent,
            remoteInfo: nowFileInfo.remoteInfo
          }).then((arg) => {
            const { code, msg } = arg ?? {}
            if (code === 3) {
              // 保存成功
              setTextContent(newTextContent)
              toast("远程文件保存成功")
              addDebugLog(`远程文件保存成功: ${nowFilePath}`, 'success')
              resolve(true)
            } else if (code === 2) {
              // 保存失败，可能需要sudo权限
              toast(`远程文件保存失败: ${msg || '权限不足'}`)
              addDebugLog(`远程文件保存失败: ${msg || '权限不足'}`, 'error')
              if (msg && msg.includes('Permission denied')) {
                openSudoDialog(msg)
              }
              resolve(false)
            } else {
              toast(`远程文件保存失败: ${msg || '未知错误'}`)
              addDebugLog(`远程文件保存失败: ${msg || '未知错误'}`, 'error')
              resolve(false)
            }
          }).catch((err) => {
            toast(`连接远程服务器失败: ${err.message || '未知错误'}`)
            addDebugLog(`连接远程服务器失败: ${err.message || '未知错误'}`, 'error')
            resolve(false)
          }).finally(() => {
            setIsSaving(false)
          })
        } else {
          // 本地文件保存
          addDebugLog(`执行本地文件保存: ${nowFilePath}`, 'info')
          ipcRenderer.invoke('is-file-write', { filePath: nowFilePath }).then((arg) => {
            // 判断文件是否可写
            const { code, msg } = arg ?? {}
            if (code === 3) {
              // 可写
              ipcRenderer.invoke('write-file', { filePath: nowFilePath, content: newTextContent }).then(() => {
                // 写入文件成功，处理当前数据
                setTextContent(newTextContent)
                toast("文件存储成功")
                addDebugLog(`本地文件保存成功: ${nowFilePath}`, 'success')
              })
              resolve(true)
            } else if (code === 2) {
              // 不可写(读取文件出错或文件不可写)
              toast(`读取文件出错或文件不可写: ${msg || '权限不足'}`)
              addDebugLog(`文件不可写: ${msg || '权限不足'}`, 'error')
              openSudoDialog(msg || '权限不足')
              resolve(false)
            } else {
              addDebugLog(`文件保存失败: 未知错误`, 'error')
              resolve(false)
            }
          }).finally(() => {
            setIsSaving(false)
          })
        }
      } else {
        resolve(false)
      }
    })
  }

  const executeRefreshCommand = () => {
    if (!nowFileInfo?.refreshCmd) {
      toast('没有命令，请在设置中配置')
      addDebugLog(`没有配置刷新命令`, 'warning')
      setIsRefreshing(false)
      return
    }

    addDebugLog(`执行刷新命令: ${nowFileInfo.refreshCmd}`, 'info')

    if (nowFileInfo.remoteInfo) {
      // 远程命令执行
      addDebugLog(`在远程服务器执行: ${nowFileInfo.remoteInfo.host}:${nowFileInfo.remoteInfo.port}`, 'info')
      ipcRenderer.invoke('exec-remote-refresh', {
        refreshCmd: nowFileInfo.refreshCmd,
        remoteInfo: nowFileInfo.remoteInfo
      }).then((res) => {
        const { code, msg, output } = res ?? {}
        switch (code) {
          case 2:
            toast('远程配置文件刷新失败:' + msg)
            addDebugLog(`远程命令执行失败: ${msg}`, 'error')
            // 检查是否需要sudo权限
            if (msg && (msg.includes('Permission denied') || msg.includes('Operation not permitted') || msg.includes('Interactive authentication required'))) {
              openSudoDialog(msg, true)
            }
            break;
          case 3:
            toast('远程配置文件刷新成功')
            addDebugLog(`远程命令执行成功`, 'success')
            if (output) {
              addDebugLog(`命令输出: ${output}`, 'info')
            }
            break;
          default:
            break;
        }
        console.log('exec-remote-refresh:', res)
      }).catch((err) => {
        toast(`远程命令执行失败: ${err.message || '未知错误'}`)
        addDebugLog(`远程命令执行失败: ${err.message || '未知错误'}`, 'error')
      }).finally(() => {
        setIsRefreshing(false)
      })
    } else {
      // 本地命令执行
      addDebugLog(`在本地执行命令: ${nowFileInfo.refreshCmd}`, 'info')
      ipcRenderer.invoke('exec-refresh', { refreshCmd: nowFileInfo?.refreshCmd }).then((res) => {
        const { code, msg } = res ?? {}
        switch (code) {
          case 2:
            toast('配置文件刷新失败:' + msg)
            addDebugLog(`本地命令执行失败: ${msg}`, 'error')
            // 检查是否需要sudo权限
            if (msg && (msg.includes('Permission denied') || msg.includes('Operation not permitted') || msg.includes('Interactive authentication required'))) {
              openSudoDialog(msg, true)
            }
            break;
          case 3:
            toast('配置文件刷新成功')
            addDebugLog(`本地命令执行成功: ${msg}`, 'success')
            break;
          default:
            break;
        }
        console.log('exec-refresh:', res)
      }).finally(() => {
        setIsRefreshing(false)
      })
    }
  }

  const onRefreshBtnClick = () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    addDebugLog(`开始刷新操作: ${nowFileInfo?.refreshCmd}`, 'info')

    // 检查文件是否有更新
    if (isEditing) {
      // 文件有更新，先保存再刷新
      addDebugLog(`文件有更新，先保存文件`, 'info')
      onSaveBtnClick().then((res) => {
        if (res) {
          // 保存成功，执行刷新命令
          executeRefreshCommand()
        } else {
          addDebugLog(`文件保存失败，取消刷新操作`, 'error')
          setIsRefreshing(false)
        }
      }).catch(() => {
        addDebugLog(`保存操作异常，取消刷新操作`, 'error')
        setIsRefreshing(false)
      })
    } else {
      // 文件没有更新，直接执行刷新命令
      addDebugLog(`文件无更新，直接执行刷新命令`, 'info')
      executeRefreshCommand()
    }
  }

  const onCopyBtnClick = async (filePath: string) => {
    if (filePath) {
      try {
        await navigator.clipboard.writeText(filePath)
        setIsPathCopied(true)
        setTimeout(() => setIsPathCopied(false), 2000)
        toast("文件路径复制成功")
      } catch (err) {
        toast("路径复制失败，请重试")
      }
    }
  }

  const onReloadFileBtnClick = () => {
    if (!nowFilePath || !nowFileInfo || isReloadingFile) return

    setIsReloadingFile(true)

    if (nowFileInfo.remoteInfo) {
      // 远程文件重新加载
      setDownloadProgress(0)
      setDownloadSpeed('')
      setDownloadStatus('正在重新连接远程服务器...')

      // 监听下载进度
      const handleDownloadProgress = (_, data) => {
        const { progress, status, speed } = data
        setDownloadProgress(progress)
        setDownloadStatus(status)
        setDownloadSpeed(speed)
      }

      // 监听调试日志
      const handleDebugLog = (_, data) => {
        const { message, type } = data
        addDebugLog(message, type)
      }

      ipcRenderer.on('download-progress', handleDownloadProgress)
      ipcRenderer.on('debug-log', handleDebugLog)

      addDebugLog(`开始重新加载远程文件: ${nowFilePath}`, 'info')

      ipcRenderer.invoke('read-remote-file-content', {
        filePath: nowFilePath,
        remoteInfo: nowFileInfo.remoteInfo
      }).then((arg) => {
        const { content, code, msg } = arg ?? {};
        if (code === 3 && typeof content === 'string') {
          setTextContent(content)
          setNewTextContent(content)
          toast("远程文件内容已刷新")
          addDebugLog(`远程文件重新加载成功: ${nowFilePath}`, 'success')
        } else {
          toast(`读取远程文件失败: ${msg || '未知错误'}`)
          setDownloadStatus('重新加载失败')
          addDebugLog(`远程文件重新加载失败: ${msg || '未知错误'}`, 'error')
        }
      }).catch((err) => {
        toast(`连接远程服务器失败: ${err.message || '未知错误'}`)
        setDownloadStatus('连接失败')
        addDebugLog(`重新加载时连接远程服务器失败: ${err.message || '未知错误'}`, 'error')
      }).finally(() => {
        // 移除监听器
        ipcRenderer.removeListener('download-progress', handleDownloadProgress)
        ipcRenderer.removeListener('debug-log', handleDebugLog)

        setTimeout(() => {
          setIsReloadingFile(false)
          setDownloadProgress(0)
          setDownloadSpeed('')
          setDownloadStatus('')
        }, 1500)
      })
    } else {
      // 本地文件重新加载
      addDebugLog(`开始重新加载本地文件: ${nowFilePath}`, 'info')
      ipcRenderer.invoke('read-file-content', { filePath: nowFilePath }).then((arg) => {
        const { content } = arg ?? {};
        if (typeof content === 'string') {
          setTextContent(content)
          setNewTextContent(content)
          toast("文件内容已刷新")
          addDebugLog(`本地文件重新加载成功: ${nowFilePath}`, 'success')
        } else {
          toast("读取文件失败，请重试")
          addDebugLog(`本地文件重新加载失败: ${nowFilePath}`, 'error')
        }
      }).finally(() => {
        setIsReloadingFile(false)
      })
    }
  }

  return <>
    {/* Top Management Bar */}
    <div className="w-full max-w-full bg-content1 p-4 pr-2 flex justify-between items-center border-b border-divider">
      <div className="flex items-center" style={{ width: 'calc(100% - 192px)' }}>
        {!isLeftPanelOpen && (
          <Button
            onClick={onShowLeftPanel}
            size="icon"
            variant="ghost"
            className="mr-2 h-8 w-8 hover:bg-content2 heroui-transition rounded-lg shadow-none"
            title="显示侧边栏"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        <h1
          className={`text-lg font-semibold truncate ${isEditing ? 'text-danger' : 'text-foreground'} ${nowFilePath ? 'cursor-pointer hover:text-primary heroui-transition' : ''}`}
          onClick={nowFilePath ? () => onCopyBtnClick(nowFilePath) : undefined}
          title={nowFilePath ? '点击复制文件路径' : undefined}
        >
          {nowFilePath || '选择一个配置文件'}
        </h1>
        {!!nowFilePath && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onReloadFileBtnClick}
                  size="sm"
                  variant="ghost"
                  disabled={isReloadingFile}
                  className="text-default-500 hover:text-foreground hover:bg-content2 heroui-transition ml-1 rounded-lg shadow-none"
                >
                  {isReloadingFile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="border border-divider rounded-lg bg-content1 shadow-none">
                <p>重新读取文件内容</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className='whitespace-nowrap w-[192px] flex justify-end'>
        {!!nowFilePath && <>
          <Button
            onClick={onSaveBtnClick}
            size="sm"
            disabled={isSaving || !isEditing}
            className="mr-2 heroui-button heroui-button-primary border-0 rounded-lg shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            {isSaving ? '保存中...' : '保存'}
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onRefreshBtnClick}
                  size="sm"
                  variant="ghost"
                  disabled={isRefreshing}
                  className="text-default-500 hover:text-foreground hover:bg-content2 heroui-transition border-0 rounded-lg shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRefreshing ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-1 h-4 w-4" />
                  )}
                  {isRefreshing ? '刷新中...' : '刷新'}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="border border-divider rounded-lg bg-content1 shadow-none">
                <p>{nowFileInfo?.refreshCmd}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>}
        <Button
          onClick={() => setIsSettingDialogOpen(true)}
          size="sm"
          variant="ghost"
          className="text-default-500 hover:text-foreground hover:bg-content2 heroui-transition ml-2 rounded-lg shadow-none"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}
          size="sm"
          variant="ghost"
          className={`text-default-500 hover:text-foreground hover:bg-content2 heroui-transition ml-2 rounded-lg shadow-none ${isAIPanelOpen ? 'bg-content2 text-foreground' : ''}`}
          title="AI助手"
        >
          <Bot className="h-4 w-4" />
        </Button>
      </div>
    </div>
    <SettingsDialog isSettingDialogOpen={isSettingDialogOpen} setIsSettingDialogOpen={setIsSettingDialogOpen} />
    <SudoDialog />
  </>
}