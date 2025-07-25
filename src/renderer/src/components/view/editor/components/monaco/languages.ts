
// 注册自定义的 nginx 语言支持
export function registerNginxLanguage(monaco) {
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
export function registerApacheLanguage(monaco) {
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
export function getLanguageFromFilePath(filePath: string, fileExt: string): string {
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
