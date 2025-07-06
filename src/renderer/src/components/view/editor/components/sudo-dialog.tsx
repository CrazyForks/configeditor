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
import { isSudoDialogOpenAtom, newTextContentAtom, nowFileInfoAtom, nowFilePathAtom, textContentAtom, sudoScenarioAtom } from '@/components/view/editor/store'
import { useAtom } from 'jotai'
import { useState } from 'react'
import { toast } from "sonner"
const { ipcRenderer } = window.require('electron')

export function SudoDialog() {
    const [password, setPassword] = useState('')
    const [isSudoDialogOpen, setIsSudoDialogOpen] = useAtom(isSudoDialogOpenAtom)
    const [nowFilePath] = useAtom(nowFilePathAtom)
    const [nowFileInfo] = useAtom(nowFileInfoAtom)
    const [newTextContent] = useAtom(newTextContentAtom)
    const [, setTextContent] = useAtom(textContentAtom)
    const [sudoScenario] = useAtom(sudoScenarioAtom)

    const onOk = () => {
        if (!password.trim()) {
            toast('请输入密码')
            return
        }

        if (sudoScenario.purpose === 'command') {
            // 执行命令
            if (nowFileInfo?.remoteInfo) {
                // 远程命令执行
                ipcRenderer.invoke('exec-remote-refresh-sudo', { 
                    refreshCmd: nowFileInfo.refreshCmd,
                    remoteInfo: nowFileInfo.remoteInfo,
                    sudoPassword: password
                }).then((arg) => {
                    const { code, msg } = arg ?? {}
                    if (code === 3) {
                        toast("远程命令执行成功")
                        setIsSudoDialogOpen(false)
                        setPassword('')
                    } else {
                        toast(`远程命令执行失败: ${msg || '权限验证失败'}`)
                    }
                }).catch((err) => {
                    toast(`连接远程服务器失败: ${err.message || '未知错误'}`)
                })
            } else {
                // 本地命令执行
                ipcRenderer.invoke('exec-refresh-sudo', { 
                    refreshCmd: nowFileInfo?.refreshCmd,
                    sudoPassword: password 
                }).then((arg) => {
                    const { code, msg } = arg ?? {}
                    if (code === 3) {
                        toast("命令执行成功")
                        setIsSudoDialogOpen(false)
                        setPassword('')
                    } else {
                        toast(`命令执行失败: ${msg || '权限验证失败'}`)
                    }
                }).catch((err) => {
                    toast(`命令执行失败: ${err.message || '未知错误'}`)
                })
            }
        } else {
            // 文件操作
            if (nowFileInfo?.remoteInfo) {
                // 远程文件使用sudo保存
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
                        setIsSudoDialogOpen(false)
                        setPassword('')
                    } else {
                        toast(`远程文件保存失败: ${msg || '权限验证失败'}`)
                    }
                }).catch((err) => {
                    toast(`连接远程服务器失败: ${err.message || '未知错误'}`)
                })
            } else {
                // 本地文件使用sudo保存
                ipcRenderer.invoke('write-file-sudo', { 
                    filePath: nowFilePath, 
                    content: newTextContent, 
                    sudoPassword: password 
                }).then((arg) => {
                    const { code, msg } = arg ?? {}
                    if (code === 3) {
                        setTextContent(newTextContent)
                        toast("文件保存成功")
                        setIsSudoDialogOpen(false)
                        setPassword('')
                    } else {
                        toast(`文件保存失败: ${msg || '权限验证失败'}`)
                    }
                }).catch((err) => {
                    toast(`保存文件失败: ${err.message || '未知错误'}`)
                })
            }
        }
    }

    const onCancel = () => {
        setIsSudoDialogOpen(false)
        setPassword('')
    }

    return (
        <Dialog open={isSudoDialogOpen} onOpenChange={setIsSudoDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{sudoScenario.description}</DialogTitle>
                    <DialogDescription>
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
                        />
                    </div>
                </div>
                <DialogFooter className="sm:justify-end">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        className="rounded-md"
                    >
                        取消
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onOk}
                        className=" bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                    >
                        确定
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
