import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { isSudoDialogOpenAtom, newTextContentAtom, nowFileInfoAtom, nowFilePathAtom, textContentAtom, sudoScenarioAtom, addDebugLogAtom } from '@/components/view/editor/store'
import { useAtom } from 'jotai'
import { useState } from 'react'
import { toast } from "sonner"
const { ipcRenderer } = window.require('electron')

export function SudoDialog() {
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSudoDialogOpen, setIsSudoDialogOpen] = useAtom(isSudoDialogOpenAtom)
    const [nowFilePath] = useAtom(nowFilePathAtom)
    const [nowFileInfo] = useAtom(nowFileInfoAtom)
    const [newTextContent] = useAtom(newTextContentAtom)
    const [, setTextContent] = useAtom(textContentAtom)
    const [sudoScenario] = useAtom(sudoScenarioAtom)
    const [, addDebugLog] = useAtom(addDebugLogAtom)

    const onOk = () => {
        if (!password.trim()) {
            toast('请输入密码')
            return
        }

        setIsLoading(true)
        addDebugLog(`开始执行sudo操作: ${sudoScenario.purpose === 'command' ? '命令执行' : '文件保存'}`, 'info')

        if (sudoScenario.purpose === 'command') {
            // 执行命令
            if (nowFileInfo?.remoteInfo) {
                // 远程命令执行
                addDebugLog(`使用sudo执行远程命令: ${nowFileInfo.refreshCmd}`, 'info')
                ipcRenderer.invoke('exec-remote-refresh-sudo', { 
                    refreshCmd: nowFileInfo.refreshCmd,
                    remoteInfo: nowFileInfo.remoteInfo,
                    sudoPassword: password
                }).then((arg) => {
                    const { code, msg, output } = arg ?? {}
                    if (code === 3) {
                        toast("远程命令执行成功")
                        addDebugLog(`sudo远程命令执行成功`, 'success')
                        if (output) {
                            addDebugLog(`命令输出: ${output}`, 'info')
                        }
                        setIsSudoDialogOpen(false)
                        setPassword('')
                    } else {
                        toast(`远程命令执行失败: ${msg || '权限验证失败'}`)
                        addDebugLog(`sudo远程命令执行失败: ${msg || '权限验证失败'}`, 'error')
                    }
                }).catch((err) => {
                    toast(`连接远程服务器失败: ${err.message || '未知错误'}`)
                    addDebugLog(`sudo远程连接失败: ${err.message || '未知错误'}`, 'error')
                }).finally(() => {
                    setIsLoading(false)
                })
            } else {
                // 本地命令执行
                addDebugLog(`使用sudo执行本地命令: ${nowFileInfo?.refreshCmd}`, 'info')
                ipcRenderer.invoke('exec-refresh-sudo', { 
                    refreshCmd: nowFileInfo?.refreshCmd,
                    sudoPassword: password 
                }).then((arg) => {
                    const { code, msg, output } = arg ?? {}
                    if (code === 3) {
                        toast("命令执行成功")
                        addDebugLog(`sudo本地命令执行成功`, 'success')
                        if (output) {
                            addDebugLog(`命令输出: ${output}`, 'info')
                        }
                        setIsSudoDialogOpen(false)
                        setPassword('')
                    } else {
                        toast(`命令执行失败: ${msg || '权限验证失败'}`)
                        addDebugLog(`sudo本地命令执行失败: ${msg || '权限验证失败'}`, 'error')
                    }
                }).catch((err) => {
                    toast(`命令执行失败: ${err.message || '未知错误'}`)
                    addDebugLog(`sudo本地命令执行失败: ${err.message || '未知错误'}`, 'error')
                }).finally(() => {
                    setIsLoading(false)
                })
            }
        } else {
            // 文件操作
            if (nowFileInfo?.remoteInfo) {
                // 远程文件使用sudo保存
                addDebugLog(`使用sudo保存远程文件: ${nowFilePath}`, 'info')
                ipcRenderer.invoke('write-remote-file-sudo', { 
                    filePath: nowFilePath, 
                    content: newTextContent,
                    remoteInfo: nowFileInfo.remoteInfo,
                    sudoPassword: password
                }).then((arg) => {
                    const { code, msg } = arg ?? {}
                    if (code === 3) {
                        // 保存成功
                        setTextContent(newTextContent)
                        toast("远程文件保存成功")
                        addDebugLog(`sudo远程文件保存成功: ${nowFilePath}`, 'success')
                        setIsSudoDialogOpen(false)
                        setPassword('')
                    } else {
                        toast(`远程文件保存失败: ${msg || '权限验证失败'}`)
                        addDebugLog(`sudo远程文件保存失败: ${msg || '权限验证失败'}`, 'error')
                    }
                }).catch((err) => {
                    toast(`连接远程服务器失败: ${err.message || '未知错误'}`)
                    addDebugLog(`sudo远程连接失败: ${err.message || '未知错误'}`, 'error')
                }).finally(() => {
                    setIsLoading(false)
                })
            } else {
                // 本地文件使用sudo保存
                addDebugLog(`使用sudo保存本地文件: ${nowFilePath}`, 'info')
                ipcRenderer.invoke('write-file-sudo', { 
                    filePath: nowFilePath, 
                    content: newTextContent, 
                    sudoPassword: password 
                }).then((arg) => {
                    const { code, msg } = arg ?? {}
                    if (code === 3) {
                        setTextContent(newTextContent)
                        toast("文件保存成功")
                        addDebugLog(`sudo本地文件保存成功: ${nowFilePath}`, 'success')
                        setIsSudoDialogOpen(false)
                        setPassword('')
                    } else {
                        toast(`文件保存失败: ${msg || '权限验证失败'}`)
                        addDebugLog(`sudo本地文件保存失败: ${msg || '权限验证失败'}`, 'error')
                    }
                }).catch((err) => {
                    toast(`保存文件失败: ${err.message || '未知错误'}`)
                    addDebugLog(`sudo本地文件保存失败: ${err.message || '未知错误'}`, 'error')
                }).finally(() => {
                    setIsLoading(false)
                })
            }
        }
    }

    const onCancel = () => {
        setIsSudoDialogOpen(false)
        setPassword('')
        setIsLoading(false)
    }

    return (
        <Dialog open={isSudoDialogOpen} onOpenChange={(open) => {
            if (!open) {
                setPassword('')
                setIsLoading(false)
            }
            setIsSudoDialogOpen(open)
        }}>
            <DialogContent className="sm:max-w-md border border-divider rounded-2xl bg-content1 shadow-none">
                <DialogHeader>
                    <DialogTitle className="text-foreground">{sudoScenario.description}</DialogTitle>
                    <DialogDescription className="text-default-500">
                        {sudoScenario.type === 'root' 
                            ? '需要输入root用户的密码以执行此操作' 
                            : '也就是 sudo 密码，命令的执行需要权限'
                        }
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                        <Input 
                            type="password" 
                            placeholder={sudoScenario.type === 'root' ? '输入root密码' : '输入用户密码'} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="border border-divider rounded-lg bg-content2 focus:border-primary shadow-none heroui-transition"
                        />
                    </div>
                </div>
                <DialogFooter className="sm:justify-end">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="heroui-button heroui-button-secondary border-0 rounded-lg shadow-none"
                    >
                        取消
                    </Button>
                    <Button
                        type="button"
                        onClick={onOk}
                        disabled={isLoading}
                        className="heroui-button heroui-button-primary border-0 rounded-lg shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? '处理中...' : '确定'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
