import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppSettings, appSettingsAtom, fileInfosAtom, nowFileInfoAtom, nowFilePathAtom, themeAtom, setThemeAtom, AIProvider } from '@/components/view/editor/store'
import { useAtom } from 'jotai'
import { HardDrive, Info, Moon, RefreshCw, Sun, Monitor, Bot } from 'lucide-react'
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
  const [newFontSize, setNewFontSize] = useState(14)
  
  // AI设置相关状态
  const [newAIProvider, setNewAIProvider] = useState<AIProvider>('openai')
  const [newAIApiKey, setNewAIApiKey] = useState('')
  const [newAIBaseUrl, setNewAIBaseUrl] = useState('')
  const [newAIModel, setNewAIModel] = useState('')
  const [newAIEnabled, setNewAIEnabled] = useState(false)

  useEffect(() => {
    if (nowFileInfo && isSettingDialogOpen) {
      setNewRefreshCmd(nowFileInfo.refreshCmd)
    }
    setNewFontSize(appSettings.fontSize)
    
    // 初始化AI设置，添加安全检查
    setNewAIProvider(appSettings.ai?.provider || 'openai')
    setNewAIApiKey(appSettings.ai?.apiKey || '')
    setNewAIBaseUrl(appSettings.ai?.baseUrl || 'https://api.openai.com/v1')
    setNewAIModel(appSettings.ai?.model || 'gpt-3.5-turbo')
    setNewAIEnabled(appSettings.ai?.enabled || false)
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
    const newAppSettings: AppSettings = {
      ...appSettings, 
      fontSize: newFontSize,
      ai: {
        provider: newAIProvider,
        apiKey: newAIApiKey,
        baseUrl: newAIBaseUrl,
        model: newAIModel,
        enabled: newAIEnabled
      }
    };
    setAppSettings(newAppSettings);
    saveAppSettings(newAppSettings);
    alert('保存成功')
  }

  const onRevertBtnClick = () => {
    if (nowFileInfo) {
      setNewRefreshCmd(nowFileInfo.refreshCmd)
    }
    setNewFontSize(appSettings.fontSize)
    
    // 还原AI设置，添加安全检查
    setNewAIProvider(appSettings.ai?.provider || 'openai')
    setNewAIApiKey(appSettings.ai?.apiKey || '')
    setNewAIBaseUrl(appSettings.ai?.baseUrl || 'https://api.openai.com/v1')
    setNewAIModel(appSettings.ai?.model || 'gpt-3.5-turbo')
    setNewAIEnabled(appSettings.ai?.enabled || false)
  }

  return (
    <Dialog open={isSettingDialogOpen} onOpenChange={setIsSettingDialogOpen}>
      <DialogContent className="sm:max-w-[625px] border border-divider rounded-2xl bg-content1 shadow-none">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">设置</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={nowFilePath ? "file" : "general"} className="w-full">
          <TabsList className={`grid w-full ${nowFilePath ? 'grid-cols-4' : 'grid-cols-3'} bg-content2 p-1 rounded-lg`}>
            {!!nowFilePath && (
              <TabsTrigger 
                value="file" 
                className="rounded-md heroui-transition data-[state=active]:bg-content1 data-[state=active]:shadow-none"
              >
                文件
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="general" 
              className="rounded-md heroui-transition data-[state=active]:bg-content1 data-[state=active]:shadow-none"
            >
              通用
            </TabsTrigger>
            <TabsTrigger 
              value="editor" 
              className="rounded-md heroui-transition data-[state=active]:bg-content1 data-[state=active]:shadow-none"
            >
              编辑
            </TabsTrigger>
            <TabsTrigger 
              value="ai" 
              className="rounded-md heroui-transition data-[state=active]:bg-content1 data-[state=active]:shadow-none"
            >
              AI
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
                  className="bg-content2 border-divider focus:border-primary heroui-transition rounded-lg shadow-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="permissions" className="text-sm font-medium text-foreground">文件权限</Label>
                <Select disabled value={newPermission} onValueChange={setNewPermission}>
                  <SelectTrigger className="bg-content2 border-divider focus:border-primary heroui-transition rounded-lg shadow-none">
                    <SelectValue placeholder="选择文件权限" />
                  </SelectTrigger>
                  <SelectContent className="border border-divider rounded-lg bg-content1 shadow-none">
                    <SelectItem value="read" className="heroui-transition hover:bg-content2">Read</SelectItem>
                    <SelectItem value="write" className="heroui-transition hover:bg-content2">Write</SelectItem>
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
                  className="bg-content2 border-divider focus:border-primary heroui-transition rounded-lg shadow-none"
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="general">
            <div className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <Label htmlFor="theme" className="text-sm font-medium text-foreground">主题模式</Label>
                <Select value={currentTheme} onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}>
                  <SelectTrigger className="bg-content2 dark:bg-content3 border-divider focus:border-primary heroui-transition shadow-none">
                    <SelectValue placeholder="选择主题模式" />
                  </SelectTrigger>
                  <SelectContent className="heroui-card">
                    <SelectItem value="light" className="heroui-transition hover:bg-content2 dark:hover:bg-content3">
                      <div className="flex items-center">
                        <Sun className="mr-2 h-4 w-4" />
                        浅色模式
                      </div>
                    </SelectItem>
                    <SelectItem value="dark" className="heroui-transition hover:bg-content2 dark:hover:bg-content3">
                      <div className="flex items-center">
                        <Moon className="mr-2 h-4 w-4" />
                        深色模式
                      </div>
                    </SelectItem>
                    <SelectItem value="system" className="heroui-transition hover:bg-content2 dark:hover:bg-content3">
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
                  className="w-full justify-start heroui-button-secondary border-divider hover:border-primary shadow-none"
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
                  <SelectTrigger className="bg-content2 dark:bg-content3 border-divider focus:border-primary heroui-transition shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="heroui-card">
                    <SelectItem value="12" className="heroui-transition hover:bg-content2 dark:hover:bg-content3">12px</SelectItem>
                    <SelectItem value="14" className="heroui-transition hover:bg-content2 dark:hover:bg-content3">14px</SelectItem>
                    <SelectItem value="16" className="apple-transition hover:bg-apple-gray-2 dark:hover:bg-apple-gray-4">16px</SelectItem>
                    <SelectItem value="18" className="apple-transition hover:bg-apple-gray-2 dark:hover:bg-apple-gray-4">18px</SelectItem>
                    <SelectItem value="20" className="apple-transition hover:bg-apple-gray-2 dark:hover:bg-apple-gray-4">20px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai">
            <div className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ai-enabled" className="text-sm font-medium text-foreground">启用AI助手</Label>
                  <Switch
                    id="ai-enabled"
                    checked={newAIEnabled}
                    onCheckedChange={setNewAIEnabled}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-provider" className="text-sm font-medium text-foreground">AI提供商</Label>
                <Select value={newAIProvider} onValueChange={(value: AIProvider) => {
                  setNewAIProvider(value)
                  // 自动设置默认配置
                  if (value === 'openai') {
                    setNewAIBaseUrl('https://api.openai.com/v1')
                    setNewAIModel('gpt-3.5-turbo')
                  } else if (value === 'deepseek') {
                    setNewAIBaseUrl('https://api.deepseek.com/v1')
                    setNewAIModel('deepseek-chat')
                  }
                }}>
                  <SelectTrigger className="bg-content2 border-divider focus:border-primary heroui-transition shadow-none">
                    <SelectValue placeholder="选择AI提供商" />
                  </SelectTrigger>
                  <SelectContent className="heroui-card">
                    <SelectItem value="openai" className="heroui-transition hover:bg-content2">
                      <div className="flex items-center">
                        <Bot className="mr-2 h-4 w-4" />
                        OpenAI
                      </div>
                    </SelectItem>
                    <SelectItem value="deepseek" className="heroui-transition hover:bg-content2">
                      <div className="flex items-center">
                        <Bot className="mr-2 h-4 w-4" />
                        DeepSeek
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-api-key" className="text-sm font-medium text-foreground">API Key</Label>
                <Input
                  id="ai-api-key"
                  type="password"
                  value={newAIApiKey}
                  onChange={(e) => setNewAIApiKey(e.target.value)}
                  placeholder="输入您的API Key"
                  className="bg-content2 border-divider focus:border-primary heroui-transition shadow-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-base-url" className="text-sm font-medium text-foreground">API Base URL</Label>
                <Input
                  id="ai-base-url"
                  value={newAIBaseUrl}
                  onChange={(e) => setNewAIBaseUrl(e.target.value)}
                  placeholder="API端点地址"
                  className="bg-content2 border-divider focus:border-primary heroui-transition shadow-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-model" className="text-sm font-medium text-foreground">模型</Label>
                <Input
                  id="ai-model"
                  value={newAIModel}
                  onChange={(e) => setNewAIModel(e.target.value)}
                  placeholder="模型名称"
                  className="bg-content2 border-divider focus:border-primary heroui-transition shadow-none"
                />
              </div>

              {newAIProvider === 'openai' && (
                <div className="text-xs text-default-500 bg-content2 p-3 rounded-lg">
                  <p className="font-medium mb-1">OpenAI 配置说明：</p>
                  <p>• 推荐模型：gpt-3.5-turbo, gpt-4</p>
                  <p>• 需要有效的OpenAI API Key</p>
                </div>
              )}

              {newAIProvider === 'deepseek' && (
                <div className="text-xs text-default-500 bg-content2 p-3 rounded-lg">
                  <p className="font-medium mb-1">DeepSeek 配置说明：</p>
                  <p>• 推荐模型：deepseek-chat, deepseek-coder</p>
                  <p>• 需要有效的DeepSeek API Key</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <div className="flex items-center space-x-2 justify-end">
            <Button 
              onClick={onRevertBtnClick} 
              variant="outline"
              className="heroui-button heroui-button-secondary border border-divider hover:border-primary rounded-lg shadow-none"
            >
              <RefreshCw className="mr-2 h-4 w-4" />还原设置
            </Button>
            <Button 
              onClick={onSaveBtnClick}
              className="heroui-button heroui-button-primary border-0 rounded-lg shadow-none"
            >
              <HardDrive className="mr-2 h-4 w-4" />存储设置
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
