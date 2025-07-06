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
import { isSudoDialogOpenAtom, newTextContentAtom, nowFileInfoAtom, nowFilePathAtom, textContentAtom } from '@/components/view/editor/store'
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

    const onOk = () => {
        if (!password.trim()) {
            toast('请输入密码')
            return
        }

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

    const onCancel = () => {
        setIsSudoDialogOpen(false)
        setPassword('')
    }

    return (
        <Dialog open={isSudoDialogOpen} onOpenChange={setIsSudoDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>请输入你的登录密码</DialogTitle>
                    <DialogDescription>也就是 sudo 密码，命令的执行需要权限</DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                        <Input 
                            type="password" 
                            placeholder="输入密码" 
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
