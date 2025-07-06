import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fileInfosAtom, nowFilePathAtom, isLeftPanelOpenAtom } from '@/components/view/editor/store'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { useAtom } from 'jotai'
import {
    Atom,
    FileText,
    Trash2,
    Globe,
    ChevronLeft
} from 'lucide-react'
import { useState } from 'react'
import { useShowFilePaths } from '../hooks'
import { saveFileInfos } from '../utils'
import { AddFileButton } from './add-file-button'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import {
    CSS,
} from '@dnd-kit/utilities'

interface SortableFileItemProps {
    filePath: string;
    fileInfo: any;
    isRemoteFile: boolean;
    isSelected: boolean;
    isDragEnabled: boolean;
    onSelect: (filePath: string) => void;
    onDelete: (filePath: string, e: any) => void;
}

function SortableFileItem({ filePath, fileInfo, isRemoteFile, isSelected, isDragEnabled, onSelect, onDelete }: SortableFileItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ 
        id: filePath,
        disabled: !isDragEnabled 
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                group 
                relative 
                flex 
                items-center 
                w-full 
                py-3 
                px-4 
                text-sm 
                text-gray-700
                transition-colors 
                ${isSelected ?
                    'bg-blue-100 hover:bg-blue-100' :
                    'hover:bg-gray-100'
                }
                ${isDragging ? 'z-50' : ''}
            `}
        >
            <div
                {...(isDragEnabled ? { ...attributes, ...listeners } : {})}
                className={`flex-1 ${isDragEnabled && isDragging ? 'cursor-grabbing' : isDragEnabled ? 'cursor-grab' : ''}`}
                onClick={() => onSelect(filePath)}
            >
                <div className="flex items-center w-full py-1">
                    <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900 truncate">
                            {fileInfo?.description || (filePath.split('/')?.pop() ?? '')}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                            {filePath}
                        </div>
                    </div>
                    {isRemoteFile && (
                        <div title="远程文件" className="flex-shrink-0">
                            <Globe className="ml-2 h-3 w-3 text-blue-500" />
                        </div>
                    )}
                </div>
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-500 hover:text-red-500 ml-2"
                onClick={(e) => onDelete(filePath, e)}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}

export function FileSidebar() {
    const [fileInfos, setFileInfos] = useAtom(fileInfosAtom)
    const [nowFilePath, setNowFilePath] = useAtom(nowFilePathAtom)
    const [, setIsLeftPanelOpen] = useAtom(isLeftPanelOpenAtom)
    const [searchName, setSearchName] = useState<string>('')
    const showFilePaths = useShowFilePaths(searchName)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const onSelect = (filePath: string) => {
        setNowFilePath(filePath)
    }

    const onDelete = (filePath: string, e: any) => {
        e.stopPropagation()
        const newFileInfos = fileInfos.filter((file) => file.filePath !== filePath)
        setFileInfos(newFileInfos)
        saveFileInfos(newFileInfos)
        if (nowFilePath === filePath) {
            setNowFilePath('')
        }
    }

    const onAppTitleClick = () => {
        setNowFilePath('')
    }

    const onHideLeftPanel = () => {
        setIsLeftPanelOpen(false)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        // 只在没有搜索过滤时允许排序
        if (active.id !== over?.id && searchName.trim() === '') {
            const oldIndex = fileInfos.findIndex((item) => item.filePath === active.id);
            const newIndex = fileInfos.findIndex((item) => item.filePath === over?.id);
            
            const newFileInfos = arrayMove(fileInfos, oldIndex, newIndex);
            setFileInfos(newFileInfos);
            saveFileInfos(newFileInfos);
        }
    };

    // 拖拽功能只在没有搜索时启用
    const isDragEnabled = searchName.trim() === '';

    return (
        <div className="w-full h-full bg-white flex flex-col shadow-sm">
            <div className="p-4 border-b border-gray-200">
                <div className='flex justify-between items-center mb-3'>
                    <h2 onClick={onAppTitleClick} className="text-lg font-semibold flex items-center text-gray-700 cursor-pointer hover:underline">
                        <Atom className="mr-2 h-5 w-5" />
                        配置文件管理器
                    </h2>
                    <Button
                        onClick={onHideLeftPanel}
                        size="sm"
                        variant="ghost"
                        className="text-gray-500 hover:text-gray-700"
                        title="隐藏侧边栏"
                    >
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
                    <div className="flex items-center justify-center h-full text-gray-500">空空如也</div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={showFilePaths} strategy={verticalListSortingStrategy}>
                            {showFilePaths.map((filePath) => {
                                const fileInfo = fileInfos.find(f => f.filePath === filePath)
                                const isRemoteFile = !!fileInfo?.remoteInfo
                                
                                return (
                                    <SortableFileItem
                                        key={filePath}
                                        filePath={filePath}
                                        fileInfo={fileInfo}
                                        isRemoteFile={isRemoteFile}
                                        isSelected={nowFilePath === filePath}
                                        isDragEnabled={isDragEnabled}
                                        onSelect={onSelect}
                                        onDelete={onDelete}
                                    />
                                )
                            })}
                        </SortableContext>
                    </DndContext>
                )}
            </ScrollArea>
        </div>
    )
}
