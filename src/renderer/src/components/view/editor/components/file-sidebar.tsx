import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fileInfosAtom, nowFilePathAtom, isLeftPanelOpenAtom, isDebugPanelOpenAtom } from '@/components/view/editor/store'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAtom } from 'jotai'
import {
    Atom,
    Trash2,
    Globe,
    ChevronLeft,
    GripVertical
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

interface ContextMenuProps {
    x: number;
    y: number;
    filePath: string;
    onClose: () => void;
    onDelete: (filePath: string) => void;
}

function ContextMenu({ x, y, filePath, onClose, onDelete }: ContextMenuProps) {
    const handleDelete = () => {
        onDelete(filePath);
        onClose();
    };

    return (
        <div
            className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-32"
            style={{ left: x, top: y }}
            onMouseLeave={onClose}
        >
            <button
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                onClick={handleDelete}
            >
                <Trash2 className="h-4 w-4 mr-2" />
                移除
            </button>
        </div>
    );
}

interface SortableFileItemProps {
    filePath: string;
    fileInfo: any;
    isRemoteFile: boolean;
    isSelected: boolean;
    isDragEnabled: boolean;
    onSelect: (filePath: string) => void;
    onDelete: (filePath: string) => void;
    onContextMenu: (e: React.MouseEvent, filePath: string) => void;
}

function SortableFileItem({ filePath, fileInfo, isRemoteFile, isSelected, isDragEnabled, onSelect, onDelete, onContextMenu }: SortableFileItemProps) {
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
                px-2
                text-sm 
                text-gray-700
                transition-colors 
                ${isSelected ?
                    'bg-blue-100 hover:bg-blue-100' :
                    'hover:bg-gray-100'
                }
                ${isDragging ? 'z-50' : ''}
            `}
            onContextMenu={(e) => onContextMenu(e, filePath)}
        >
            {/* 拖动图标 */}
            {isDragEnabled && (
                <div
                    {...attributes}
                    {...listeners}
                    className="mr-2 cursor-grab active:cursor-grabbing hover:text-gray-600 transition-colors"
                    title="拖动排序"
                >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
            )}
            
            {/* 文件内容区域 - 只处理点击选择 */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className="flex-1 cursor-pointer overflow-hidden"
                            onClick={() => onSelect(filePath)}
                        >
                            <div className="flex items-center w-full py-1">
                                <div className="flex-1 text-left min-w-0">
                                    <div className="font-medium text-gray-900 truncate flex items-center">
                                        {isRemoteFile && (
                                            <div title="远程文件" className="flex-shrink-0">
                                                <Globe className="mr-1 h-3 w-3 text-blue-500" />
                                            </div>
                                        )}
                                        <span className="truncate">
                                            {fileInfo?.description || (filePath.split('/')?.pop() ?? '')}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {filePath}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="start" className="max-w-md p-3 bg-white border border-gray-200 shadow-lg">
                        <div className="space-y-1">
                            <div className="text-sm text-gray-600">
                                标题: {fileInfo?.description || (filePath.split('/')?.pop() ?? '')}
                            </div>
                            <div className="text-sm text-gray-600">
                                路径: {filePath}
                            </div>
                            <div className="text-sm text-gray-600">
                                类型: {isRemoteFile ? '远程' : '本地'}文件
                            </div>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}

export function FileSidebar() {
    const [fileInfos, setFileInfos] = useAtom(fileInfosAtom)
    const [nowFilePath, setNowFilePath] = useAtom(nowFilePathAtom)
    const [, setIsLeftPanelOpen] = useAtom(isLeftPanelOpenAtom)
    const [isDebugPanelOpen, setIsDebugPanelOpen] = useAtom(isDebugPanelOpenAtom)
    const [searchName, setSearchName] = useState<string>('')
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; filePath: string } | null>(null)
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

    const onDelete = (filePath: string) => {
        const newFileInfos = fileInfos.filter((file) => file.filePath !== filePath)
        setFileInfos(newFileInfos)
        saveFileInfos(newFileInfos)
        if (nowFilePath === filePath) {
            setNowFilePath('')
        }
    }

    const onContextMenu = (e: React.MouseEvent, filePath: string) => {
        e.preventDefault()
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            filePath
        })
    }

    const onCloseContextMenu = () => {
        setContextMenu(null)
    }

    const onAppTitleClick = () => {
        setNowFilePath('')
    }

    const onShowDebugPanel = () => {
        setIsDebugPanelOpen(!isDebugPanelOpen)
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
        <div className="w-full h-full bg-white flex flex-col shadow-sm" onClick={onCloseContextMenu}>
            <div className="p-4 border-b border-gray-200">
                <div className='flex justify-between items-center mb-3'>
                    <h2 className="text-lg font-semibold flex items-center text-gray-700">
                        <Atom className="mr-2 h-5 w-5" onClick={onShowDebugPanel} />
                        <span onClick={onAppTitleClick} className="hidden sm:inline cursor-pointer hover:underline select-none">配置文件管理器</span>
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
                                        onContextMenu={onContextMenu}
                                    />
                                )
                            })}
                        </SortableContext>
                    </DndContext>
                )}
            </ScrollArea>
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    filePath={contextMenu.filePath}
                    onClose={onCloseContextMenu}
                    onDelete={onDelete}
                />
            )}
        </div>
    )
}
