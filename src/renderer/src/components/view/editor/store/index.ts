'use client'

import { atom } from 'jotai'

export type FileInfo = { filePath: string; refreshCmd: string }
export type AppSettings = {
  theme: 'light' | 'dark' | 'system' | '',
  lineNumber: boolean,
  fontSize: number,
  editorTheme: string,
  language: string,
  wordWrap: boolean,
  lineNumbers: boolean,
}

export const STORE_APP_SETTINGS = 'STORE_APP_SETTINGS';

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

export const appSettingsAtom = atom<AppSettings>({
  theme: 'system',
  editorTheme: 'github',
  lineNumber: true,
  fontSize: 14,
  language: 'en',
  wordWrap: false,
  lineNumbers: true,
})

export const isSudoDialogOpenAtom = atom(false)
