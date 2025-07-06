
import { appSettingsAtom, newTextContentAtom, nowFileInfoAtom, nowFilePathAtom, textContentAtom, nowFileExtAtom } from '@/components/view/editor/store'
import Editor, { loader } from '@monaco-editor/react'
import { useAtom } from 'jotai'
import * as monaco from "monaco-editor"
import { WelcomeFragment } from './welcome-fragment'
import { useEffect } from 'react'
import { toast } from "sonner"
const { ipcRenderer } = window.require('electron')
loader.config({ monaco });

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
    'nginx.conf': 'ini', // nginx配置文件，使用ini格式作为备选
    'nginx.config': 'ini',
    '.htaccess': 'ini', // Apache配置，使用ini格式作为备选
    'httpd.conf': 'ini',
    'apache.conf': 'ini',
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

    // 根据文件路径和扩展名获取语言类型
    const editorLanguage = nowFilePath ? getLanguageFromFilePath(nowFilePath, nowFileExt) : 'plaintext'

    useEffect(() => {
        if (nowFilePath && nowFileInfo) {
            // 检查是否为远程文件
            if (nowFileInfo.remoteInfo) {
                // 远程文件，使用 SSH 读取
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
                    }
                }).catch((err) => {
                    toast(`连接远程服务器失败: ${err.message || '未知错误'}`)
                    setTextContent('')
                    setNewTextContent('')
                })
            } else {
                // 本地文件
                ipcRenderer.invoke('read-file-content', { filePath: nowFilePath }).then((arg) => {
                    const { content } = arg ?? {};
                    if (typeof content === 'string') {
                        setTextContent(content)
                        setNewTextContent(content)
                    } else {
                        setTextContent('')
                        setNewTextContent('')
                    }
                })
            }
        }
    }, [nowFilePath, nowFileInfo])

    const onEditorChange = (content: string | undefined) => {
        setNewTextContent(content ?? '')
    }

    return <div className='w-full' style={{height: 'calc(100% - 65px)'}}>
        {/* Text Editor */}
        {nowFilePath ? <Editor
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
        /> : <WelcomeFragment />}
    </div>
}
