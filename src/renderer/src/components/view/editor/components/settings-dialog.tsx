import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppSettings, appSettingsAtom, fileInfosAtom, nowFileInfoAtom, nowFilePathAtom, themeAtom, setThemeAtom } from '@/components/view/editor/store'
import { useAtom } from 'jotai'
import { HardDrive, Info, Moon, RefreshCw, Sun, Monitor } from 'lucide-react'
import { useEffect, useState } from 'react'
import _ from 'lodash'
import { saveAppSettings, saveFileInfos } from "../utils"

export default function SettingsDialog(props: {
  isSettingDialogOpen: boolean
  setIsSettingDialogOpen: (isSettingDialogOpen: boolean) => void
}) {
  const { isSettingDialogOpen, setIsSettingDialogOpen } = props;
  const [nowFilePath] = useAtom(nowFilePathAtom)
  const [nowFileInfo] = useAtom(nowFileInfoAtom)
  const [fileInfos, setFileInfos] = useAtom(fileInfosAtom)

  const [appSettings, setAppSettings] = useAtom(appSettingsAtom)
  const [currentTheme] = useAtom(themeAtom)
  const [, setTheme] = useAtom(setThemeAtom)
  
  const [newPermission, setNewPermission] = useState('read')
  const [newRefreshCmd, setNewRefreshCmd] = useState('')
  const [newEditorTheme, setNewEditorTheme] = useState('vs')
  const [newFontSize, setNewFontSize] = useState(14)

  useEffect(() => {
    if (nowFileInfo && isSettingDialogOpen) {
      setNewRefreshCmd(nowFileInfo.refreshCmd)
    }
    setNewFontSize(appSettings.fontSize)
    setNewEditorTheme(appSettings.editorTheme)
  }, [isSettingDialogOpen, nowFileInfo, appSettings])

  const onSaveBtnClick = () => {
    if (nowFileInfo) {
      const newFileInfos = _.cloneDeep(fileInfos)
      newFileInfos.forEach(fileInfo => {
        if (fileInfo.filePath === nowFilePath) {
          fileInfo.refreshCmd = newRefreshCmd
        }
      })
      saveFileInfos(newFileInfos)
      setFileInfos(newFileInfos)
    }
    const newAppSettings: AppSettings = {...appSettings, fontSize: newFontSize, editorTheme: newEditorTheme};
    setAppSettings(newAppSettings);
    saveAppSettings(newAppSettings);
    alert('保存成功')
  }

  const onRevertBtnClick = () => {
    if (nowFileInfo) {
      setNewRefreshCmd(nowFileInfo.refreshCmd)
    }
  }

  return (
    <Dialog open={isSettingDialogOpen} onOpenChange={setIsSettingDialogOpen}>
      <DialogContent className="sm:max-w-[625px] apple-card apple-card-hover glass-effect">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">设置</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={nowFilePath ? "file" : "general"} className="w-full">
          <TabsList className={`grid w-full ${nowFilePath ? 'grid-cols-3' : 'grid-cols-2'} bg-apple-gray-2 dark:bg-apple-gray-4 p-1 rounded-lg`}>
            {!!nowFilePath && (
              <TabsTrigger 
                value="file" 
                className="rounded-md apple-transition data-[state=active]:bg-background data-[state=active]:shadow-apple-sm"
              >
                文件
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="general" 
              className="rounded-md apple-transition data-[state=active]:bg-background data-[state=active]:shadow-apple-sm"
            >
              通用
            </TabsTrigger>
            <TabsTrigger 
              value="editor" 
              className="rounded-md apple-transition data-[state=active]:bg-background data-[state=active]:shadow-apple-sm"
            >
              编辑
            </TabsTrigger>
          </TabsList>
          <TabsContent value="file">
            <div className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <Label htmlFor="current-file-path" className="text-sm font-medium text-foreground">当前文件路径</Label>
                <Input
                  id="current-file-path"
                  value={nowFilePath}
                  readOnly
                  className="bg-apple-gray-2 dark:bg-apple-gray-4 border-apple-gray-5 focus:border-apple-blue apple-transition"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="permissions" className="text-sm font-medium text-foreground">文件权限</Label>
                <Select disabled value={newPermission} onValueChange={setNewPermission}>
                  <SelectTrigger className="bg-apple-gray-2 dark:bg-apple-gray-4 border-apple-gray-5 focus:border-apple-blue apple-transition">
                    <SelectValue placeholder="选择文件权限" />
                  </SelectTrigger>
                  <SelectContent className="apple-card">
                    <SelectItem value="read" className="apple-transition hover:bg-apple-gray-2 dark:hover:bg-apple-gray-4">Read</SelectItem>
                    <SelectItem value="write" className="apple-transition hover:bg-apple-gray-2 dark:hover:bg-apple-gray-4">Write</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="command" className="text-sm font-medium text-foreground">刷新按钮命令</Label>
                <Input 
                  id="command" 
                  placeholder="Enter command..." 
                  value={newRefreshCmd} 
                  onChange={e => setNewRefreshCmd(e.target.value)}
                  className="bg-apple-gray-2 dark:bg-apple-gray-4 border-apple-gray-5 focus:border-apple-blue apple-transition"
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="general">
            <div className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <Label htmlFor="theme" className="text-sm font-medium text-foreground">主题模式</Label>
                <Select value={currentTheme} onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}>
                  <SelectTrigger className="bg-apple-gray-2 dark:bg-apple-gray-4 border-apple-gray-5 focus:border-apple-blue apple-transition">
                    <SelectValue placeholder="选择主题模式" />
                  </SelectTrigger>
                  <SelectContent className="apple-card">
                    <SelectItem value="light" className="apple-transition hover:bg-apple-gray-2 dark:hover:bg-apple-gray-4">
                      <div className="flex items-center">
                        <Sun className="mr-2 h-4 w-4" />
                        浅色模式
                      </div>
                    </SelectItem>
                    <SelectItem value="dark" className="apple-transition hover:bg-apple-gray-2 dark:hover:bg-apple-gray-4">
                      <div className="flex items-center">
                        <Moon className="mr-2 h-4 w-4" />
                        深色模式
                      </div>
                    </SelectItem>
                    <SelectItem value="system" className="apple-transition hover:bg-apple-gray-2 dark:hover:bg-apple-gray-4">
                      <div className="flex items-center">
                        <Monitor className="mr-2 h-4 w-4" />
                        跟随系统
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">关于</Label>
                <Button 
                  variant="outline" 
                  className="w-full justify-start apple-button-secondary border-apple-gray-5 hover:border-apple-blue"
                >
                  <Info className="mr-2 h-4 w-4" /> 关于我们
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="editor">
            <div className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <Label htmlFor="font-size" className="text-sm font-medium text-foreground">字体大小</Label>
                <Select value={String(newFontSize)} onValueChange={v => {console.log('zws', v); setNewFontSize(parseInt(v, 10))}}>
                  <SelectTrigger className="bg-apple-gray-2 dark:bg-apple-gray-4 border-apple-gray-5 focus:border-apple-blue apple-transition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="apple-card">
                    <SelectItem value="12" className="apple-transition hover:bg-apple-gray-2 dark:hover:bg-apple-gray-4">12px</SelectItem>
                    <SelectItem value="14" className="apple-transition hover:bg-apple-gray-2 dark:hover:bg-apple-gray-4">14px</SelectItem>
                    <SelectItem value="16" className="apple-transition hover:bg-apple-gray-2 dark:hover:bg-apple-gray-4">16px</SelectItem>
                    <SelectItem value="18" className="apple-transition hover:bg-apple-gray-2 dark:hover:bg-apple-gray-4">18px</SelectItem>
                    <SelectItem value="20" className="apple-transition hover:bg-apple-gray-2 dark:hover:bg-apple-gray-4">20px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme" className="text-sm font-medium text-foreground">编辑器主题</Label>
                <Select value={newEditorTheme} onValueChange={setNewEditorTheme}>
                  <SelectTrigger className="bg-apple-gray-2 dark:bg-apple-gray-4 border-apple-gray-5 focus:border-apple-blue apple-transition">
                    <SelectValue placeholder="选择主题" />
                  </SelectTrigger>
                  <SelectContent className="apple-card">
                    <SelectItem value="vs" className="apple-transition hover:bg-apple-gray-2 dark:hover:bg-apple-gray-4">浅色</SelectItem>
                    <SelectItem value="vs-dark" className="apple-transition hover:bg-apple-gray-2 dark:hover:bg-apple-gray-4">深色</SelectItem>
                    <SelectItem value="hc-black" className="apple-transition hover:bg-apple-gray-2 dark:hover:bg-apple-gray-4">高对比度</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <div className="flex items-center space-x-2 justify-end">
            <Button 
              onClick={onRevertBtnClick} 
              variant="outline"
              className="apple-button-secondary border-apple-gray-5 hover:border-apple-blue"
            >
              <RefreshCw className="mr-2 h-4 w-4" />还原设置
            </Button>
            <Button 
              onClick={onSaveBtnClick}
              className="apple-button-primary"
            >
              <HardDrive className="mr-2 h-4 w-4" />存储设置
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
