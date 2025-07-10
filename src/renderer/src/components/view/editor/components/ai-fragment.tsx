import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  addChatMessageAtom, 
  appSettingsAtom, 
  chatMessagesAtom, 
  clearChatMessagesAtom, 
  isAIResponseLoadingAtom, 
  nowFileInfoAtom, 
  nowFilePathAtom, 
  textContentAtom 
} from '@/components/view/editor/store'
import { useAtom } from 'jotai'
import { Bot, Send, Trash2, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { toast } from "sonner"

export function AIFragment({ onClose }: { onClose: () => void }) {
  const [appSettings] = useAtom(appSettingsAtom)
  const [chatMessages] = useAtom(chatMessagesAtom)
  const [, addChatMessage] = useAtom(addChatMessageAtom)
  const [, clearChatMessages] = useAtom(clearChatMessagesAtom)
  const [isLoading, setIsLoading] = useAtom(isAIResponseLoadingAtom)
  const [nowFilePath] = useAtom(nowFilePathAtom)
  const [nowFileInfo] = useAtom(nowFileInfoAtom)
  const [textContent] = useAtom(textContentAtom)
  
  const [inputValue, setInputValue] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [chatMessages])

  // 聚焦输入框
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    if (!appSettings.ai.enabled || !appSettings.ai.apiKey) {
      toast.error('请先在设置中配置AI API')
      return
    }

    const userMessage = inputValue.trim()
    setInputValue('')

    // 添加用户消息
    addChatMessage({
      role: 'user',
      content: userMessage
    })

    setIsLoading(true)

    try {
      // 构建系统提示词
      let systemPrompt = '你是一个配置文件助手，帮助用户分析和修改配置文件。'
      
      if (nowFilePath && textContent) {
        systemPrompt += `\n\n当前正在编辑的文件：${nowFilePath}\n\n文件内容：\n${textContent}`
        
        if (nowFileInfo?.description) {
          systemPrompt += `\n\n文件描述：${nowFileInfo.description}`
        }
      }

      // 准备消息历史
      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ]

      // 根据provider调用不同的API
      let apiUrl = appSettings.ai.baseUrl
      let headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appSettings.ai.apiKey}`
      }

      if (appSettings.ai.provider === 'deepseek') {
        apiUrl = apiUrl || 'https://api.deepseek.com/v1'
      } else if (appSettings.ai.provider === 'openai') {
        apiUrl = apiUrl || 'https://api.openai.com/v1'
      }

      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: appSettings.ai.model,
          messages,
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        addChatMessage({
          role: 'assistant',
          content: data.choices[0].message.content
        })
      } else {
        throw new Error('API响应格式异常')
      }

    } catch (error) {
      console.error('AI API调用失败:', error)
      addChatMessage({
        role: 'assistant',
        content: `抱歉，AI服务暂时不可用：${error instanceof Error ? error.message : '未知错误'}`
      })
      toast.error('AI请求失败，请检查API配置')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearChat = () => {
    clearChatMessages()
    toast.success('聊天记录已清空')
  }

  return (
    <div className="flex flex-col h-full bg-content1 border-l border-divider">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-divider">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">AI 助手</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleClearChat}
            size="sm"
            variant="ghost"
            className="text-default-500 hover:text-foreground hover:bg-content2 heroui-transition"
            disabled={chatMessages.length === 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={onClose}
            size="sm"
            variant="ghost"
            className="text-default-500 hover:text-foreground hover:bg-content2 heroui-transition"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 当前文件信息 */}
      {nowFilePath && (
        <div className="p-3 bg-content2 border-b border-divider">
          <div className="text-xs text-default-500 mb-1">当前文件</div>
          <div className="text-sm font-medium truncate" title={nowFilePath}>
            {nowFilePath}
          </div>
        </div>
      )}

      {/* 聊天区域 */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-12 w-12 text-default-300 mb-4" />
            <h3 className="text-lg font-medium text-default-500 mb-2">开始对话</h3>
            <p className="text-sm text-default-400 max-w-xs">
              {nowFilePath 
                ? '询问关于当前配置文件的任何问题，我将帮助您分析和修改配置。'
                : '请先打开一个配置文件，然后询问相关问题。'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-content2 text-foreground'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-2 opacity-70 ${
                    message.role === 'user' ? 'text-primary-foreground' : 'text-default-500'
                  }`}>
                    {message.timestamp}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-content2 text-foreground rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    <span className="text-sm">AI正在思考...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <Separator />

      {/* 输入区域 */}
      <div className="p-4">
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              !appSettings.ai.enabled 
                ? "请先在设置中配置AI..." 
                : nowFilePath 
                  ? "询问关于当前文件的问题..."
                  : "有什么可以帮助您的吗？"
            }
            disabled={!appSettings.ai.enabled || isLoading}
            className="flex-1 bg-content2 border-divider focus:border-primary heroui-transition"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || !appSettings.ai.enabled || isLoading}
            className="heroui-button heroui-button-primary"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {!appSettings.ai.enabled && (
          <div className="text-xs text-warning mt-2">
            ⚠️ AI功能未启用，请在设置中配置API后启用
          </div>
        )}
      </div>
    </div>
  )
}
