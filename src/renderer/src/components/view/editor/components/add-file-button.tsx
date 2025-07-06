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
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { FileInfo, fileInfosAtom, filePathsAtom, nowFilePathAtom } from '@/components/view/editor/store'
import { useAtom } from 'jotai'
import {
    FolderSearch,
    Plus,
    ChevronDown,
    ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import { saveFileInfos } from '../utils'
const { ipcRenderer } = window.require('electron')

export function AddFileButton() {
    const [filePath, setFilePath] = useState('')
    const [, setNowFilePath] = useAtom(nowFilePathAtom)
    const [fileInfos, setFileInfos] = useAtom(fileInfosAtom);
    const [filePaths] = useAtom(filePathsAtom)
    const [open, setOpen] = useState(false);
    
    // 高级设置状态
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
    const [host, setHost] = useState('')
    const [port, setPort] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [description, setDescription] = useState('')

    const onOk = () => {
        // 验证文件描述不能为空
        if (!description.trim()) {
            alert('请输入文件描述')
            return
        }
        
        // 验证远程连接信息
        if (isAdvancedOpen) {
            if (!host.trim() || !port.trim() || !username.trim() || !password.trim()) {
                alert('请填写完整的远程连接信息')
                return
            }
        }

        ipcRenderer.invoke('read-file-content', { filePath }).then((arg) => {
            if (arg && arg.content && typeof arg.content === 'string') {
                const newFileInfos: FileInfo[] = [...fileInfos];
                if (!filePaths.includes(filePath)) {
                    const fileInfo: FileInfo = {
                        filePath, 
                        refreshCmd: 'cat ' + filePath,
                        description: description.trim(),
                        remoteInfo: isAdvancedOpen ? {
                            host: host.trim(),
                            port: parseInt(port),
                            username: username.trim(),
                            password: password.trim()
                        } : undefined
                    };
                    newFileInfos.unshift(fileInfo);
                }
                setFileInfos(newFileInfos)
                saveFileInfos(newFileInfos)
                setNowFilePath(filePath)
                setFilePath('')
                setDescription('')
                // 重置高级设置
                setIsAdvancedOpen(false)
                setHost('')
                setPort('')
                setUsername('')
                setPassword('')
                setOpen(false)
            } else {
                alert('读取文件失败！可能文件不存在或文件权限不足')
                // 权限问题，这里是只读的，大部分文件都是只读的，所以这里不做特殊处理了
            }
        })
    }

    // 打开选择配置文件窗口
    async function openSelectDialog(): Promise<string[]> {
        return new Promise((resolve) => {
            ipcRenderer.invoke('open-select-dialog', {}).then((arg) => {
                if (arg && arg.filePaths) {
                    resolve(arg.filePaths)
                } else {
                    resolve([])
                }
            })
        })
    }

    const onSearchBtnClick = async () => {
        const filePaths = await openSelectDialog()
        if (filePaths && filePaths.length > 0) {
            setFilePath(filePaths[0])
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="px-2 h-8 bg-blue-500 hover:bg-blue-600 rounded-md">
                    <Plus className="h-4 w-4 text-white" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>添加配置文件</DialogTitle>
                    <DialogDescription>请添加配置文件的绝对路径</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="filePath">文件路径</Label>
                            <Input 
                                id="filePath"
                                value={filePath} 
                                onChange={(e) => setFilePath(e.target.value)} 
                                placeholder="请输入文件的绝对路径"
                            />
                        </div>
                        <Button type="button" variant="secondary" className="px-3 mt-6" onClick={onSearchBtnClick}>
                            <span className="sr-only">Search</span>
                            <FolderSearch className="h-4 w-4" />
                        </Button>
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="description">描述 <span className="text-red-500">*</span></Label>
                        <Input 
                            id="description"
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            placeholder="请输入文件描述"
                        />
                    </div>
                    
                    {/* 高级设置 - 可折叠 */}
                    <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="flex items-center space-x-2 p-0 h-auto text-sm">
                                {isAdvancedOpen ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                                <span>高级设置</span>
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3 mt-3">
                            <div className="text-sm text-muted-foreground mb-2">
                                配置远程连接信息
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="host">主机地址</Label>
                                    <Input
                                        id="host"
                                        value={host}
                                        onChange={(e) => setHost(e.target.value)}
                                        placeholder="192.168.1.100"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="port">端口</Label>
                                    <Input
                                        id="port"
                                        value={port}
                                        onChange={(e) => setPort(e.target.value)}
                                        placeholder="22"
                                        type="number"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="username">用户名</Label>
                                    <Input
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="root"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="password">密码</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="请输入密码"
                                    />
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
                <DialogFooter className="sm:justify-end">
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
