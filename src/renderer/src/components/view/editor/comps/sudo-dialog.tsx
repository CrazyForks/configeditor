import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { FileInfo, fileInfosAtom, filePathsAtom, isSudoDialogOpenAtom, nowFilePathAtom } from '@/lib/store'
import { useAtom } from 'jotai'
import {
    FolderSearch,
    Plus
} from 'lucide-react'
import { useState } from 'react'
const { ipcRenderer } = window.require('electron')

export function SudoDialog() {
    const [value, setValue] = useState('')
    const [isSudoDialogOpen, setIsSudoDialogOpen] = useAtom(isSudoDialogOpenAtom)

    const onOk = () => {
        ipcRenderer.invoke('read-file-content', { value }).then((arg) => {
            if (arg && arg.content && typeof arg.content === 'string') {
                // TODO
            } else {
                alert('读取文件失败！可能文件不存在或文件权限不足')
                // TODO: 权限问题，这里是只读的，大部分文件都是只读的
            }
        })
    }

    const onCancel = () => {}

    return (
        <Dialog open={isSudoDialogOpen} onOpenChange={setIsSudoDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>请输入你的登录密码</DialogTitle>
                    <DialogDescription>也就是 sudo 密码，命令的执行需要权限</DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                        <Input value={value} onChange={(e) => setValue(e.target.value)} />
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
