import { Button } from "@/components/ui/button";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Settings, Plus, FileText, ChevronRight, Trash2, Atom, FolderSearch, Save } from "lucide-react";
import { useState } from "react";
import { useFilePathSearch } from "./utils";
import { FileSearch2 } from "lucide-react"
import { Input } from "@/components/ui/input";
import { GithubBadge, GithubBasicBadge } from 'github-star-badge';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAtom } from "jotai";
import { filePathsAtom, nowFilePathAtom } from "@/lib/store";

export function AddFileButton() {
    const onOk = () => {
        console.log('ok')
    }
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button onClick={() => { }} size="sm" className="px-2 h-8 bg-blue-500 hover:bg-blue-600 rounded-md">
                    <Plus className="h-4 w-4 text-white" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>添加配置文件</DialogTitle>
                    <DialogDescription>
                        请添加配置文件的绝对路径
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                        <Label htmlFor="link" className="sr-only">
                            Link
                        </Label>
                        <Input
                            id="link"
                            defaultValue="https://ui.shadcn.com/docs/installation"
                            readOnly
                        />
                    </div>
                    <Button type="button" variant="secondary" className="px-3">
                        <span className="sr-only">Open</span>
                        <FolderSearch className="h-4 w-4" />
                    </Button>
                </div>
                <DialogFooter className="sm:justify-end">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary" onClick={onOk} className=" bg-blue-500 hover:bg-blue-600 text-white rounded-md">
                            确定
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
export function FileSidebar(props: {
    setTextContent: React.Dispatch<React.SetStateAction<string>>,
}) {
    const { setTextContent } = props;
    const [filePaths, setFilePaths] = useAtom(filePathsAtom);
    const [nowFilePath, setNowFilePath] = useAtom(nowFilePathAtom);
    const [searchName, setSearchName] = useState<string>('');
    const showFilePaths = useFilePathSearch(filePaths, searchName);

    const onSelect = (name: string) => {
        setNowFilePath(name);
        setTextContent(`This is the content of ${name}. In a real application, the actual file content would be loaded here.`);
    };

    const onDelete = (name: string, e: any) => {
        e.stopPropagation();
        setFilePaths(filePaths.filter(file => file !== name));
        if (nowFilePath === name) {
            setNowFilePath('');
            setTextContent('');
        }
    };

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
                {(showFilePaths.length ? showFilePaths : filePaths).map((file) => (
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
            </ScrollArea>
        </div>
    );
}
