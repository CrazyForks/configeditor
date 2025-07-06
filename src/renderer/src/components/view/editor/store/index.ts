'use client'

import { atom } from 'jotai'

export type FileInfo = { 
  filePath: string; 
  refreshCmd: string;
  description: string;
  remoteInfo?: {
    host: string;
    port: number;
    username: string;
    password: string;
  }
}
export type AppSettings = {
  theme: 'light' | 'dark' | 'system' | '',
  lineNumber: boolean,
  fontSize: number,
  editorTheme: string,
  language: string,
  wordWrap: boolean,
  lineNumbers: boolean,
}
export const defaultAppSettings: AppSettings = {
  theme: 'system',
  editorTheme: 'github',
  lineNumber: true,
  fontSize: 14,
  language: 'en',
  wordWrap: false,
  lineNumbers: true,
}

export const fileInfosAtom = atom<FileInfo[]>([])
export const filePathsAtom = atom<string[]>((get) => get(fileInfosAtom).map(({ filePath }) => (filePath ?? '')))

export const nowFilePathAtom = atom('')
export const nowFileNameAtom = atom((get) => (get(nowFilePathAtom).split('/')?.pop() ?? '').replace(/\.[^/.]+$/, ''))
export const nowFileExtAtom = atom((get) => get(nowFilePathAtom).split('.')?.pop() ?? '')
export const nowFileInfoAtom = atom<FileInfo | null>((get) => get(fileInfosAtom).find(({ filePath }) => filePath === get(nowFilePathAtom)) ?? null)

// 编辑器部分
export const textContentAtom = atom('') // 原文件的内容
export const newTextContentAtom = atom('') // 编辑后的内容，与原文件内容做对比可得知是否发生了修改
export const isEditingAtom = atom((get) => get(textContentAtom) !== get(newTextContentAtom))
export const isFileLoadingAtom = atom(false)

export const isLeftPanelOpenAtom = atom(true)

// 文件下载进度相关状态
export const downloadProgressAtom = atom<number>(0) // 下载进度百分比 0-100
export const downloadSpeedAtom = atom<string>('') // 下载速度
export const downloadStatusAtom = atom<string>('') // 下载状态描述

// Debug panel 相关状态
export type DebugLogType = 'info' | 'success' | 'error' | 'warning'

export type DebugLog = {
  id: string
  message: string
  type: DebugLogType
  timestamp: string
}

export const isDebugPanelOpenAtom = atom(false)
export const debugLogsAtom = atom<DebugLog[]>([])

// 添加日志的action
export const addDebugLogAtom = atom(
  null,
  (get, set, message: string, type: DebugLogType = 'info') => {
    const currentLogs = get(debugLogsAtom);
    const timestamp = new Date().toLocaleTimeString();
    const newLog: DebugLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      timestamp
    };
    set(debugLogsAtom, [...currentLogs, newLog]);
  }
)

// 清空日志的action
export const clearDebugLogsAtom = atom(
  null,
  (_get, set) => {
    set(debugLogsAtom, []);
  }
)

// 保存和刷新loading状态
export const isSavingAtom = atom(false)
export const isRefreshingAtom = atom(false)

// sudo dialog相关
export type SudoScenario = {
  type: 'user' | 'root'
  description: string
  purpose: 'file' | 'command'  // 区分是文件操作还是命令执行
}

export const isSudoDialogOpenAtom = atom(false)
export const sudoScenarioAtom = atom<SudoScenario>({
  type: 'user',
  description: '请输入你的登录密码（sudo密码）',
  purpose: 'file'
})

export const appSettingsAtom = atom<AppSettings>(defaultAppSettings)
