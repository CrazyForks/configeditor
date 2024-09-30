'use client'

import { atom } from "jotai";

export const filePathsAtom = atom<string[]>([]);
export const nowFilePathAtom = atom('');
// nowFilePath的计算属性，获取文件名，不包括后缀
export const nowFileNameAtom = atom((get) => (get(nowFilePathAtom).split('/')?.pop() ?? '').replace(/\.[^/.]+$/, ''));
// nowFilePath的计算属性，获取文件后缀
export const nowFileExtAtom = atom((get) => (get(nowFilePathAtom).split('.')?.pop() ?? ''));
