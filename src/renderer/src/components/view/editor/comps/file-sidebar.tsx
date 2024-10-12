import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fileInfosAtom, isLeftPanelOpenAtom, nowFilePathAtom } from '@/lib/store'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { useAtom } from 'jotai'
import {
    Atom,
    ChevronLeft,
    FileText,
    Trash2
} from 'lucide-react'
import { useState } from 'react'
import { useShowFilePaths } from '../hooks'
import { AddFileButton } from './add-file-button'

export function FileSidebar() {
    const [fileInfos, setFileInfos] = useAtom(fileInfosAtom)
    const [nowFilePath, setNowFilePath] = useAtom(nowFilePathAtom)
    const [searchName, setSearchName] = useState<string>('')
    const showFilePaths = useShowFilePaths(searchName)
    const [isLeftPanelOpen, setIsLeftPanelOpen] = useAtom(isLeftPanelOpenAtom)

    const onSelect = (filePath: string) => {
        setNowFilePath(filePath)
    }

    const onDelete = (filePath: string, e: any) => {
        e.stopPropagation()
        const newFileInfos = fileInfos.filter((file) => file.filePath !== filePath)
        setFileInfos(newFileInfos)
        localStorage.setItem('filePaths', JSON.stringify(newFileInfos))
        if (nowFilePath === filePath) {
            setNowFilePath('')
        }
    }

    const onCloseLeftPanelBtnClick = () => {
        setIsLeftPanelOpen(false)
    }

    return (
        <div className="w-full h-full bg-white flex flex-col shadow-sm">
            <div className="p-4 border-b border-gray-200">
                <div className='flex justify-between items-center mb-3'>
                    <h2 className="text-lg font-semibold flex items-center text-gray-700">
                        <Atom className="mr-2 h-5 w-5" />
                        配置文件管理器
                    </h2>
                    <Button onClick={onCloseLeftPanelBtnClick} size="icon" variant="ghost" className=" w-8h-8">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>
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
                        {showFilePaths.map((filePath) => (
                            <div
                                key={filePath}
                                className={`
                                    group 
                                    relative 
                                    flex 
                                    items-center 
                                    w-full 
                                    py-2 
                                    px-4 
                                    text-sm 
                                    text-gray-700
                                    transition-colors 
                                    ${nowFilePath === filePath ?
                                        'bg-blue-100 hover:bg-blue-100' :
                                        'hover:bg-gray-100'
                                    }
                                `}
                            >
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start p-0 hover:bg-transparent"
                                    onClick={() => onSelect(filePath)}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    {filePath.split('/')?.pop() ?? ''}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-500 hover:text-red-500"
                                    onClick={(e) => onDelete(filePath, e)}
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
