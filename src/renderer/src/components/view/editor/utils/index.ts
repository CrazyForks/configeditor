import { AppSettings, defaultAppSettings, FileInfo } from "../store";

export function isSubstr(str: string, sub: string) {
  let res = false;
  let i = 0;
  let j = 0;
  if (str.length === 0 || sub.length === 0) {
    res = false;
  }
  while (i < str.length && j < sub.length) {
    if (str[i] === sub[j]) {
      i += 1;
      j += 1;
    } else {
      i += 1;
    }
  }
  if (j === sub.length) { 
    res = true;
  }
  return res;
}

export function getDefaultRefreshCmd(filePath: string) {
  let res = `cat ${filePath}`;
  if (filePath) {
    // 获取文件名
    const fileName = filePath.split("/").pop();
    if (fileName?.includes('nginx')) {
      res = `nginx -s reload`;
    } else if (fileName?.includes('.zshrc')) {
      res = `source ${filePath}`;
    } else if (fileName?.includes('.bashrc')) {
      res = `source ${filePath}`;
    } else if (fileName?.includes('vimrc')) {
      res = `source ${filePath}`;
    } else if (fileName?.includes('tmux.conf')) {
      res = `tmux source-file ${filePath}`;
    } else if (fileName?.includes('gitconfig')) {
      res = `git config --global -e`;
    }
  }
  return res;
}

const FILE_INFOS = 'configeditorfileinfos';
export function saveFileInfos(newFileInfos: FileInfo[]) {
  localStorage.setItem(FILE_INFOS, JSON.stringify(newFileInfos))
}

export function readFileInfos(): FileInfo[] {
  return JSON.parse(localStorage.getItem(FILE_INFOS) || '[]')
}

export const STORE_APP_SETTINGS = 'STORE_APP_SETTINGS';
export function saveAppSettings(appSettings: AppSettings) {
  localStorage.setItem(STORE_APP_SETTINGS, JSON.stringify(appSettings))
}

export function readAppSettings(): AppSettings {
  try {
    return JSON.parse(localStorage.getItem(STORE_APP_SETTINGS) || '');
  } catch (e) {
    return defaultAppSettings;
  }
}
