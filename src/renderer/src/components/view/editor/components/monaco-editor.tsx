
import { appSettingsAtom, newTextContentAtom, nowFileInfoAtom, nowFilePathAtom, textContentAtom, nowFileExtAtom, isFileLoadingAtom, downloadProgressAtom, downloadSpeedAtom, downloadStatusAtom } from '@/components/view/editor/store'
import Editor, { loader } from '@monaco-editor/react'
import { useAtom } from 'jotai'
import * as monaco from "monaco-editor"
import { WelcomeFragment } from './welcome-fragment'
import { useEffect } from 'react'
import { toast } from "sonner"
import { Loader2, Download } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
const { ipcRenderer } = window.require('electron')
loader.config({ monaco });

// 注册自定义的 nginx 语言支持
function registerNginxLanguage() {
  // 注册语言
  monaco.languages.register({ id: 'nginx' });

  // 定义语法高亮规则
  monaco.languages.setMonarchTokensProvider('nginx', {
    tokenizer: {
      root: [
        // 注释
        [/#.*$/, 'comment'],
        
        // 字符串
        [/"[^"]*"/, 'string'],
        [/'[^']*'/, 'string'],
        
        // 数字
        [/\b\d+[kmgtKMGT]?\b/, 'number'],
        [/\b\d+\.\d+[kmgtKMGT]?\b/, 'number'],
        
        // 指令关键字
        [/\b(server|location|upstream|proxy_pass|listen|server_name|root|index|try_files|return|rewrite|if|set|include|worker_processes|worker_connections|keepalive_timeout|client_max_body_size|proxy_set_header|proxy_cache|proxy_cache_valid|add_header|expires|gzip|ssl_certificate|ssl_certificate_key|ssl_protocols|ssl_ciphers|access_log|error_log|log_format|limit_req|limit_conn|deny|allow)\b/, 'keyword'],
        
        // HTTP 方法和状态码
        [/\b(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH)\b/, 'keyword'],
        [/\b[1-5]\d{2}\b/, 'number'],
        
        // 变量
        [/\$[a-zA-Z_][a-zA-Z0-9_]*/, 'variable'],
        
        // 正则表达式标记
        [/~\*?/, 'operator'],
        [/[=!]~/, 'operator'],
        
        // 操作符
        [/[{}();,]/, 'delimiter'],
        [/[<>=!]/, 'operator'],
        
        // IP 地址和域名
        [/\b(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?\b/, 'number'],
        [/\b[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*\b/, 'type'],
        
        // 时间单位
        [/\b\d+[smhdwy]\b/, 'number'],
        
        // 文件路径
        [/\/[^\s;]*/, 'string'],
        
        // on/off 关键字
        [/\b(on|off)\b/, 'keyword'],
      ]
    }
  });

  // 设置语言配置
  monaco.languages.setLanguageConfiguration('nginx', {
    comments: {
      lineComment: '#',
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ],
    folding: {
      markers: {
        start: new RegExp('^\\s*#region\\b'),
        end: new RegExp('^\\s*#endregion\\b')
      }
    }
  });
}

// 注册自定义的 Apache 语言支持
function registerApacheLanguage() {
  monaco.languages.register({ id: 'apache' });

  monaco.languages.setMonarchTokensProvider('apache', {
    tokenizer: {
      root: [
        // 注释
        [/#.*$/, 'comment'],
        
        // 字符串
        [/"[^"]*"/, 'string'],
        [/'[^']*'/, 'string'],
        
        // 指令关键字
        [/\b(VirtualHost|Directory|Location|Files|FilesMatch|DirectoryMatch|LocationMatch|ServerRoot|ServerName|ServerAlias|DocumentRoot|Listen|LoadModule|ErrorLog|CustomLog|LogLevel|AllowOverride|Options|Order|Allow|Deny|Require|RewriteEngine|RewriteRule|RewriteCond|Redirect|Alias|ScriptAlias|SetEnv|SetEnvIf|Header|ExpiresActive|ExpiresByType|BrowserMatch|User|Group|ServerTokens|ServerSignature|KeepAlive|MaxKeepAliveRequests|KeepAliveTimeout|Timeout|LimitRequestBody|LimitRequestFields|LimitRequestFieldSize|LimitRequestLine)\b/, 'keyword'],
        
        // 数字
        [/\b\d+\b/, 'number'],
        
        // 操作符和分隔符
        [/[<>]/, 'delimiter'],
        [/[{}();,]/, 'delimiter'],
        
        // 文件路径
        [/\/[^\s>]*/, 'string'],
        
        // on/off 关键字
        [/\b(on|off|On|Off)\b/, 'keyword'],
        
        // HTTP 状态码
        [/\b[1-5]\d{2}\b/, 'number'],
      ]
    }
  });

  monaco.languages.setLanguageConfiguration('apache', {
    comments: {
      lineComment: '#',
    },
    brackets: [
      ['<', '>'],
      ['{', '}'],
      ['[', ']']
    ],
    autoClosingPairs: [
      { open: '<', close: '>' },
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ]
  });
}

// 根据文件扩展名或文件名获取Monaco Editor语言类型
function getLanguageFromFilePath(filePath: string, fileExt: string): string {
  const fileName = filePath.split('/').pop()?.toLowerCase() || ''
  const ext = fileExt.toLowerCase()
  
  // 特殊文件名模式
  const specialFiles: Record<string, string> = {
    'dockerfile': 'dockerfile',
    'makefile': 'makefile',
    'cmakelists.txt': 'cmake',
    'package.json': 'json',
    'tsconfig.json': 'json',
    'composer.json': 'json',
    '.gitignore': 'plaintext',
    '.env': 'properties', // 使用properties格式来高亮环境变量文件
    '.zshrc': 'shell',
    '.bashrc': 'shell',
    '.bash_profile': 'shell',
    '.profile': 'shell',
    'nginx.conf': 'nginx', // 使用自定义的nginx语言
    'nginx.config': 'nginx',
    '.htaccess': 'apache', // 使用自定义的apache语言
    'httpd.conf': 'apache',
    'apache.conf': 'apache',
    'apache2.conf': 'apache',
    'vimrc': 'plaintext',
    '.vimrc': 'plaintext',
    'hosts': 'plaintext',
    'passwd': 'plaintext',
    'shadow': 'plaintext',
    'fstab': 'plaintext',
    'crontab': 'shell',
  }
  
  if (specialFiles[fileName]) {
    return specialFiles[fileName]
  }
  
  // 根据扩展名判断
  const extMap: Record<string, string> = {
    // Web相关
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'json': 'json',
    'jsonc': 'json',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'vue': 'html', // Vue文件使用html高亮
    'svelte': 'html', // Svelte文件使用html高亮
    
    // 编程语言
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'h': 'c',
    'hpp': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'dart': 'dart',
    'r': 'r',
    'sql': 'sql',
    'mysql': 'sql',
    'postgres': 'sql',
    'sqlite': 'sql',
    
    // 标记语言
    'md': 'markdown',
    'markdown': 'markdown',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'ini', // TOML使用ini高亮
    'ini': 'ini',
    'cfg': 'ini',
    'conf': 'ini',
    'config': 'ini',
    'properties': 'properties',
    
    // Shell脚本
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'fish': 'shell',
    'ps1': 'powershell',
    'psm1': 'powershell',
    'cmd': 'bat',
    'bat': 'bat',
    
    // 其他
    'dockerfile': 'dockerfile',
    'docker': 'dockerfile',
    'makefile': 'makefile',
    'mk': 'makefile',
    'cmake': 'cmake',
    'lua': 'lua',
    'perl': 'perl',
    'pl': 'perl',
    'tcl': 'plaintext', // TCL使用plaintext
    'vim': 'plaintext', // Vim脚本使用plaintext
    'tex': 'latex',
    'latex': 'latex',
    'log': 'plaintext', // 日志文件使用plaintext
    'txt': 'plaintext',
    'text': 'plaintext',
  }
  
  return extMap[ext] || 'plaintext'
}

export function MonacoEditor() {
    const [nowFilePath] = useAtom(nowFilePathAtom)
    const [nowFileInfo] = useAtom(nowFileInfoAtom)
    const [nowFileExt] = useAtom(nowFileExtAtom)
    const [textContent, setTextContent] = useAtom(textContentAtom);
    const [, setNewTextContent] = useAtom(newTextContentAtom);
    const [appSettings] = useAtom(appSettingsAtom);
    const [isFileLoading, setIsFileLoading] = useAtom(isFileLoadingAtom);
    const [downloadProgress, setDownloadProgress] = useAtom(downloadProgressAtom);
    const [downloadSpeed, setDownloadSpeed] = useAtom(downloadSpeedAtom);
    const [downloadStatus, setDownloadStatus] = useAtom(downloadStatusAtom);

    // 注册自定义语言（只注册一次）
    useEffect(() => {
        try {
            registerNginxLanguage();
            registerApacheLanguage();
        } catch (error) {
            // 如果语言已经注册过，会抛出错误，这里忽略
            console.warn('Custom languages may already be registered:', error);
        }
    }, []);

    // 根据文件路径和扩展名获取语言类型
    const editorLanguage = nowFilePath ? getLanguageFromFilePath(nowFilePath, nowFileExt) : 'plaintext'

    useEffect(() => {
        if (nowFilePath && nowFileInfo) {
            // 检查是否为远程文件
            if (nowFileInfo.remoteInfo) {
                // 远程文件，使用 SSH 读取
                setIsFileLoading(true)
                setDownloadProgress(0)
                setDownloadSpeed('')
                setDownloadStatus('正在初始化连接...')
                
                // 监听下载进度
                const handleDownloadProgress = (_, data) => {
                    const { progress, status, speed } = data
                    setDownloadProgress(progress)
                    setDownloadStatus(status)
                    setDownloadSpeed(speed)
                }
                
                ipcRenderer.on('download-progress', handleDownloadProgress)
                
                ipcRenderer.invoke('read-remote-file-content', { 
                    filePath: nowFilePath,
                    remoteInfo: nowFileInfo.remoteInfo 
                }).then((arg) => {
                    const { content, code, msg } = arg ?? {};
                    
                    if (code === 3 && typeof content === 'string') {
                        setTextContent(content)
                        setNewTextContent(content)
                    } else {
                        toast(`读取远程文件失败: ${msg || '未知错误'}`)
                        setTextContent('')
                        setNewTextContent('')
                        setDownloadStatus('读取失败')
                    }
                }).catch((err) => {
                    toast(`连接远程服务器失败: ${err.message || '未知错误'}`)
                    setTextContent('')
                    setNewTextContent('')
                    setDownloadStatus('连接失败')
                }).finally(() => {
                    // 移除监听器
                    ipcRenderer.removeListener('download-progress', handleDownloadProgress)
                    
                    setTimeout(() => {
                        setIsFileLoading(false)
                        setDownloadProgress(0)
                        setDownloadSpeed('')
                        setDownloadStatus('')
                    }, 1500) // 1.5秒后清除进度显示
                })
            } else {
                // 本地文件
                setIsFileLoading(true)
                ipcRenderer.invoke('read-file-content', { filePath: nowFilePath }).then((arg) => {
                    const { content } = arg ?? {};
                    if (typeof content === 'string') {
                        setTextContent(content)
                        setNewTextContent(content)
                    } else {
                        setTextContent('')
                        setNewTextContent('')
                    }
                }).finally(() => {
                    setIsFileLoading(false)
                })
            }
        } else {
            setIsFileLoading(false)
        }
    }, [nowFilePath, nowFileInfo])

    const onEditorChange = (content: string | undefined) => {
        setNewTextContent(content ?? '')
    }

    return <div className='w-full' style={{height: 'calc(100% - 65px)'}}>
        {/* Text Editor */}
        {nowFilePath ? (
            isFileLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 px-8 max-w-md mx-auto">
                    <div className="flex items-center mb-4">
                        <Loader2 className="h-8 w-8 animate-spin mr-3" />
                    </div>
                    
                    {/* 状态文本 */}
                    <p className="text-sm mb-2 text-center">
                        {downloadStatus || '正在加载文件内容...'}
                    </p>
                    
                    {/* 只在远程文件且有进度时显示进度条 */}
                    {nowFileInfo?.remoteInfo && downloadProgress > 0 && (
                        <div className="w-full space-y-2">
                            <Progress value={downloadProgress} className="w-full h-2" />
                            <div className="flex justify-between items-center text-xs text-gray-400">
                                <span>{Math.round(downloadProgress)}%</span>
                                {downloadSpeed && <span>{downloadSpeed}</span>}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <Editor
                    defaultLanguage=""
                    defaultValue=""
                    value={textContent}
                    onChange={onEditorChange}
                    language={editorLanguage}
                    options={{
                        fontSize: appSettings.fontSize, // 设置字号为14px
                        automaticLayout: true,
                        wordWrap: appSettings.wordWrap ? 'on' : 'off',
                        lineNumbers: appSettings.lineNumbers ? 'on' : 'off',
                        theme: appSettings.theme,
                    }}
                />
            )
        ) : (
            <WelcomeFragment />
        )}
    </div>
}
