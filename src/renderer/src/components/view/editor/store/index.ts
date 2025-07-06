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
export const textContentAtom = atom('')
export const newTextContentAtom = atom('')
export const isEditingAtom = atom((get) => get(textContentAtom) !== get(newTextContentAtom))

export const isLeftPanelOpenAtom = atom(true)

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
