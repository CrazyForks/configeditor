import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fileInfosAtom, nowFilePathAtom, isLeftPanelOpenAtom, isDebugPanelOpenAtom, textContentAtom, newTextContentAtom, addDebugLogAtom } from '@/components/view/editor/store'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAtom } from 'jotai'
import {
    Atom,
    Trash2,
    Globe,
    ChevronLeft,
    GripVertical,
    FolderOpen,
    Clock,
    ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import { useShowFilePaths } from '../hooks'
import { saveFileInfos } from '../utils'
import { AddFileButton } from './add-file-button'
import { HistoryMenu } from './history-menu'
import { FileHistoryRecord } from '../utils/history-storage'
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
    isRemoteFile: boolean;
    onClose: () => void;
    onDelete: (filePath: string) => void;
    onShowInFinder: (filePath: string) => void;
}

function ContextMenu({ x, y, filePath, isRemoteFile, onClose, onDelete, onShowInFinder }: ContextMenuProps) {
    const [isHistoryMenuOpen, setIsHistoryMenuOpen] = useState(false);
    const [nowFilePath, setNowFilePath] = useAtom(nowFilePathAtom)
    const [, setNewTextContent] = useAtom(newTextContentAtom);
    const [, addDebugLog] = useAtom(addDebugLogAtom);

    const handleDelete = () => {
        onDelete(filePath);
        onClose();
    };

    const handleShowInFinder = () => {
        onShowInFinder(filePath);
        onClose();
    };

    const handleHistorySelect = (record: FileHistoryRecord) => {
        // 恢复历史版本内容
        setNowFilePath(filePath);
        setTimeout(() => setNewTextContent(record.content), 0);
        addDebugLog(`已恢复到历史版本 (${new Date(record.timestamp).toLocaleString('zh-CN')})`, 'success');
        onClose();
    };

    return (
        <div
            className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg min-w-32 shadow-lg"
            style={{ left: x, top: y }}
            onMouseLeave={onClose}
        >
            {!isRemoteFile && (
                <button
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center heroui-transition rounded-md"
                    onClick={handleShowInFinder}
                >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    在Finder中打开
                </button>
            )}
            
            {/* 历史版本菜单项 */}
            <div className="relative">
                <div
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between heroui-transition rounded-md"
                    onMouseEnter={() => setIsHistoryMenuOpen(true)}
                    onMouseLeave={() => setIsHistoryMenuOpen(false)}
                >
                    <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        历史版本
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                
                {isHistoryMenuOpen && (
                    <HistoryMenu
                        filePath={filePath}
                        onSelectHistory={handleHistorySelect}
                        onMouseEnter={() => setIsHistoryMenuOpen(true)}
                        onMouseLeave={() => setIsHistoryMenuOpen(false)}
                    />
                )}
            </div>
            
            <button
                className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center heroui-transition rounded-md"
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

function SortableFileItem({ filePath, fileInfo, isRemoteFile, isSelected, isDragEnabled, onSelect, onDelete: _onDelete, onContextMenu }: SortableFileItemProps) {
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
                py-1 
                px-1
                text-sm 
                rounded-md
                text-gray-700 dark:text-gray-300
                heroui-transition 
                ${isSelected ?
                    'bg-gray-200 dark:bg-gray-900' :
                    ''
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
                    className="mr-2 cursor-grab active:cursor-grabbing hover:text-gray-600 dark:hover:text-gray-400 heroui-transition"
                    title="拖动排序"
                >
                    <GripVertical className="h-4 w-4 text-gray-400 dark:text-gray-500" />
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
                                    <div className="font-medium text-gray-800 dark:text-gray-200 truncate flex items-center">
                                        {isRemoteFile && (
                                            <div title="远程文件" className="flex-shrink-0">
                                                <Globe className="mr-1 h-3 w-3 text-primary" />
                                            </div>
                                        )}
                                        <span className="truncate">
                                            {fileInfo?.description || (filePath.split('/')?.pop() ?? '')}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {filePath}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="start" className="max-w-md p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                        <div className="space-y-1">
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                标题: {fileInfo?.description || (filePath.split('/')?.pop() ?? '')}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                路径: {filePath}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
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
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; filePath: string; isRemoteFile: boolean } | null>(null)
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
        const fileInfo = fileInfos.find(f => f.filePath === filePath)
        const isRemoteFile = !!fileInfo?.remoteInfo
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            filePath,
            isRemoteFile
        })
    }

    const onCloseContextMenu = () => {
        setContextMenu(null)
    }

    const onShowInFinder = async (filePath: string) => {
        try {
            const result = await window.electron.ipcRenderer.invoke('show-file-in-finder', { filePath })
            if (result.code === 3) {
                // 成功打开
                console.log('文件已在Finder中打开')
            } else {
                console.error('打开文件失败:', result.msg)
            }
        } catch (error) {
            console.error('打开文件失败:', error)
        }
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
        <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex flex-col" onClick={onCloseContextMenu}>
            
            {/* Header */}
            <div className="p-2">
                <div className='flex justify-between items-center mb-1'>
                    <h2 className="text-base font-semibold flex items-center text-gray-700 dark:text-gray-300">
                        <Atom className="mr-2 h-5 w-5 heroui-transition hover:text-primary cursor-pointer" onClick={onShowDebugPanel} />
                        <span onClick={onAppTitleClick} className="hidden sm:inline cursor-pointer hover:text-primary heroui-transition select-none">配置文件管理器</span>
                    </h2>
                    <Button
                        onClick={onHideLeftPanel}
                        size="icon"
                        variant="ghost"
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 heroui-transition rounded-lg shadow-none"
                        title="隐藏侧边栏"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex mb-1">
                    <Input
                        placeholder="搜索文件"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="mr-1 h-8 text-sm bg-white dark:bg-gray-700 border-none focus:border-none dark:text-white heroui-transition rounded-lg shadow-none"
                    />
                    <AddFileButton />
                </div>
            </div>
            <ScrollArea className="flex-grow pl-2">
                {!showFilePaths.length ? (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                            <div className="text-4xl mb-2">📁</div>
                            <p>空空如也</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">点击上方 + 按钮添加文件</p>
                        </div>
                    </div>
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
                    isRemoteFile={contextMenu.isRemoteFile}
                    onClose={onCloseContextMenu}
                    onDelete={onDelete}
                    onShowInFinder={onShowInFinder}
                />
            )}
        </div>
    )
}
