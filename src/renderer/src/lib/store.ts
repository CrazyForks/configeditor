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