'use client'

import { atom } from 'jotai'
export type FileInfo = { filePath: string; refreshCmd: string }
export const fileInfosAtom = atom<FileInfo[]>([])
export const filePathsAtom = atom<string[]>((get) => {
  return get(fileInfosAtom).map(({ filePath }) => (filePath ?? ''))
})

export const nowFilePathAtom = atom('')
export const nowFileNameAtom = atom((get) =>
  (get(nowFilePathAtom).split('/')?.pop() ?? '').replace(/\.[^/.]+$/, '')
)
export const nowFileExtAtom = atom((get) => get(nowFilePathAtom).split('.')?.pop() ?? '')
export const nowFileInfoAtom = atom<FileInfo | null>((get) => {
  return get(fileInfosAtom).find(({ filePath }) => filePath === get(nowFilePathAtom)) ?? null
})

export const textContentAtom = atom('')
export const newTextContentAtom = atom('')
export const isEditingAtom = atom((get) => {
  return  get(textContentAtom) !== get(newTextContentAtom)
})

export const isLeftPanelOpenAtom = atom(true)


export const STORE_APP_SETTINGS = 'STORE_APP_SETTINGS';

export type AppSettings = {
  theme: 'light' | 'dark' | 'system' | '',
  lineNumber: boolean,
  fontSize: number,
  editorTheme: string,
  language: string,
}

export const appSettingsAtom = atom<AppSettings>({
  theme: 'system',
  editorTheme: 'github',
  lineNumber: true,
  fontSize: 14,
  language: 'en',
})

export const isSudoDialogOpenAtom = atom(false)
