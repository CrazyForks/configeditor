import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
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
import { Bot, ChevronLeft, Send, Trash2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { toast } from "sonner"

// 简单的Markdown渲染函数
const renderMarkdown = (content: string) => {
  let html = content
    // 代码块
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-content3 p-3 rounded-lg overflow-x-auto my-2"><code class="text-sm">$2</code></pre>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code class="bg-content3 px-1 py-0.5 rounded text-sm">$1</code>')
    // 粗体
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // 斜体
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    // 标题
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
    // 列表
    .replace(/^\- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal">$1</li>')
    // 换行
    .replace(/\n/g, '<br/>')

  return html
}

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
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  // 打字机效果相关状态
  const [typingMessage, setTypingMessage] = useState<{
    id: string
    content: string
    displayedContent: string
    isTyping: boolean
  } | null>(null)
  const typingIntervalRef = useRef<number | null>(null)
  
  // 智能滚动相关状态
  const [userHasScrolled, setUserHasScrolled] = useState(false)
  const lastScrollTop = useRef(0)

  // 智能滚动到底部
  const scrollToBottom = () => {
    if (scrollAreaRef.current && !userHasScrolled) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }

  // 检测用户是否手动滚动
  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50 // 50px容差
      
      // 如果用户滚动到底部附近，重置为自动滚动模式
      if (isAtBottom) {
        setUserHasScrolled(false)
      } else if (scrollTop < lastScrollTop.current) {
        // 用户向上滚动
        setUserHasScrolled(true)
      }
      
      lastScrollTop.current = scrollTop
    }
  }

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [chatMessages, typingMessage])

  // 聚焦输入框
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // 清理打字机定时器
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current)
      }
    }
  }, [])

  // 打字机效果函数
  const startTyping = (messageId: string, fullContent: string) => {
    // 清除之前的定时器
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current)
    }

    setTypingMessage({
      id: messageId,
      content: fullContent,
      displayedContent: '',
      isTyping: true
    })

    let currentIndex = 0
    typingIntervalRef.current = setInterval(() => {
      if (currentIndex < fullContent.length) {
        setTypingMessage(prev => prev ? {
          ...prev,
          displayedContent: fullContent.slice(0, currentIndex + 1)
        } : null)
        currentIndex++
      } else {
        // 打字完成
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current)
        }
        setTypingMessage(prev => prev ? {
          ...prev,
          isTyping: false
        } : null)
        
        // 延迟后将消息添加到正式聊天记录并清除打字状态
        setTimeout(() => {
          addChatMessage({
            role: 'assistant',
            content: fullContent
          })
          setTypingMessage(null)
        }, 500)
      }
    }, 30) // 30ms间隔，调整这个值可以改变打字速度
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    if (!appSettings.ai?.enabled || !appSettings.ai?.apiKey) {
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
      let apiUrl = appSettings.ai?.baseUrl || 'https://api.openai.com/v1'
      let headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appSettings.ai?.apiKey || ''}`
      }

      if (appSettings.ai?.provider === 'deepseek') {
        apiUrl = apiUrl || 'https://api.deepseek.com/v1'
      } else if (appSettings.ai?.provider === 'openai') {
        apiUrl = apiUrl || 'https://api.openai.com/v1'
      }

      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: appSettings.ai?.model || 'gpt-3.5-turbo',
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
        // 使用打字机效果显示AI回复
        const messageId = Date.now().toString()
        startTyping(messageId, data.choices[0].message.content)
      } else {
        throw new Error('API响应格式异常')
      }

    } catch (error) {
      console.error('AI API调用失败:', error)
      // 错误消息也使用打字机效果
      const errorMessage = `抱歉，AI服务暂时不可用：${error instanceof Error ? error.message : '未知错误'}`
      const messageId = Date.now().toString()
      startTyping(messageId, errorMessage)
      toast.error('AI请求失败，请检查API配置')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearChat = () => {
    // 清除打字机效果
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current)
    }
    setTypingMessage(null)
    
    clearChatMessages()
    toast.success('聊天记录已清空')
  }

  return (
    <div className="flex flex-col h-full bg-content1 border-l border-divider">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-divider">
        <div className="flex items-center space-x-2">
          <Button
            onClick={onClose}
            size="sm"
            variant="ghost"
            className="text-default-500 hover:text-foreground hover:bg-content2 heroui-transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
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
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef} onScroll={handleScroll}>
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
                  <div className="text-sm whitespace-pre-wrap">
                    {message.role === 'assistant' ? (
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
                    ) : (
                      message.content
                    )}
                  </div>
                  <div className={`text-xs mt-2 opacity-70 ${
                    message.role === 'user' ? 'text-primary-foreground' : 'text-default-500'
                  }`}>
                    {message.timestamp}
                  </div>
                </div>
              </div>
            ))}
            
            {/* 打字机效果消息 */}
            {typingMessage && (
              <div className="flex justify-start">
                <div className="max-w-[80%] bg-content2 text-foreground rounded-lg p-3">
                  <div className="text-sm whitespace-pre-wrap">
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(typingMessage.displayedContent) }} />
                    {typingMessage.isTyping && (
                      <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
                    )}
                  </div>
                  <div className="text-xs mt-2 opacity-70 text-default-500">
                    {typingMessage.isTyping ? '正在输入...' : new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
            
            {isLoading && !typingMessage && (
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
        <div className="flex items-end space-x-2">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              !appSettings.ai?.enabled 
                ? "请先在设置中配置AI..." 
                : nowFilePath 
                  ? "询问关于当前文件的问题... (Shift+Enter换行，Enter发送)"
                  : "有什么可以帮助您的吗？ (Shift+Enter换行，Enter发送)"
            }
            disabled={!appSettings.ai?.enabled || isLoading}
            className="flex-1 bg-content2 border-divider focus:border-primary heroui-transition min-h-[80px] max-h-[200px] resize-none"
            rows={3}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || !appSettings.ai?.enabled || isLoading}
            className="heroui-button heroui-button-primary self-end h-12 px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {!appSettings.ai?.enabled && (
          <div className="text-xs text-warning mt-2">
            ⚠️ AI功能未启用，请在设置中配置API后启用
          </div>
        )}
      </div>
    </div>
  )
}
