import { Button } from '@/components/ui/button'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import {
    Settings,
    Plus,
    FileText,
    ChevronRight,
    Trash2,
    Atom,
    FolderSearch,
    Save
} from 'lucide-react'
import { useState } from 'react'
import { useFilePathSearch } from './utils'
import { FileSearch2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { GithubBadge, GithubBasicBadge } from 'github-star-badge'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAtom } from 'jotai'
import { filePathsAtom, nowFilePathAtom } from '@/lib/store'
const { ipcRenderer } = window.require('electron')

export function AddFileButton() {
    const [filePath, setFilePath] = useState('')
    const [nowFilePath, setNowFilePath] = useAtom(nowFilePathAtom)
    const [filePaths, setFilePaths] = useAtom(filePathsAtom)
    const [open, setOpen] = useState(false);
    const onOk = () => {
        console.log('ok', filePath)
        ipcRenderer.invoke('read-file-content', { filePath }).then((arg) => {
            console.log(arg)
            if (arg && arg.content && typeof arg.content === 'string') {
                console.log(arg.content)
                const newFilePaths = [filePath, ...filePaths]
                setFilePaths(newFilePaths)
                setNowFilePath(filePath)
                localStorage.setItem('filePaths', JSON.stringify(newFilePaths))
                setOpen(false)
            } else {
                // console.log('读取文件内容失败')
            }
        })
    }

    // 打开选择配置文件窗口
    async function openSelectDialog(): Promise<string[]> {
        return new Promise((resolve, reject) => {
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
        console.log(filePaths)
        if (filePaths && filePaths.length > 0) {
            // setFilePaths([...filePaths, ...filePathsAtom]);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    onClick={() => { }}
                    size="sm"
                    className="px-2 h-8 bg-blue-500 hover:bg-blue-600 rounded-md"
                >
                    <Plus className="h-4 w-4 text-white" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>添加配置文件</DialogTitle>
                    <DialogDescription>请添加配置文件的绝对路径</DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                        <Input value={filePath} onChange={(e) => setFilePath(e.target.value)} />
                    </div>
                    <Button type="button" variant="secondary" className="px-3" onClick={onSearchBtnClick}>
                        <span className="sr-only">Search</span>
                        <FolderSearch className="h-4 w-4" />
                    </Button>
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
export function FileSidebar() {
    const [filePaths, setFilePaths] = useAtom(filePathsAtom)
    const [nowFilePath, setNowFilePath] = useAtom(nowFilePathAtom)
    const [searchName, setSearchName] = useState<string>('')
    const showFilePaths = useFilePathSearch(filePaths, searchName)

    const onSelect = (name: string) => {
        setNowFilePath(name)
    }

    const onDelete = (name: string, e: any) => {
        e.stopPropagation()
        const newFilePaths = filePaths.filter((file) => file !== name)
        setFilePaths(newFilePaths)
        localStorage.setItem('filePaths', JSON.stringify(newFilePaths))
        if (nowFilePath === name) {
            setNowFilePath('')
        }
    }

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-700">
                    <Atom className="mr-2 h-5 w-5" />
                    配置文件管理器
                </h2>
                <div className="flex mb-2">
                    <Input
                        placeholder="搜索文件"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="mr-1 h-8 text-sm bg-gray-100 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <AddFileButton />
                </div>
            </div>
            <ScrollArea className="flex-grow">
                {!showFilePaths.length ? (
                    <>
                        <div className="flex items-center justify-center h-full text-gray-500">空空如也</div>
                    </>
                ) : (
                    <>
                        {showFilePaths.map((file) => (
                            <div
                                key={file}
                                className={`group relative flex items-center w-full py-2 px-4 text-sm hover:bg-gray-100 focus:bg-gray-100 
                            transition-colors ${nowFilePath === file ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}
                        `}
                            >
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start p-0 hover:bg-transparent"
                                    onClick={() => onSelect(file)}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    {file.split('/')?.pop() ?? ''}
                                    {/* {nowFilePath === file && <ChevronRight className="ml-auto h-4 w-4" />} */}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-500 hover:text-red-500"
                                    onClick={(e) => onDelete(file, e)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </>
                )}
            </ScrollArea>
        </div>
    )
}
