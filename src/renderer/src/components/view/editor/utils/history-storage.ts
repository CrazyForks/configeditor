/**
 * 文件历史版本存储工具
 * 使用 IndexedDB 存储历史版本数据
 */

export interface FileHistoryRecord {
  id: string; // 唯一标识符
  filePath: string; // 文件路径
  fileName: string; // 文件名
  content: string; // 文件内容
  timestamp: number; // 创建时间戳
  size: number; // 文件大小（字节）
}

class HistoryStorage {
  private dbName = 'ConfigEditorHistory';
  private dbVersion = 1;
  private storeName = 'fileHistory';
  private maxTotalSize = 25 * 1024 * 1024; // 25MB
  private maxRecordsPerFile = 20;
  private db: IDBDatabase | null = null;

  /**
   * 初始化数据库连接
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('filePath', 'filePath', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * 生成记录ID
   */
  private generateId(filePath: string, timestamp: number): string {
    return `${btoa(filePath)}_${timestamp}`;
  }

  /**
   * 计算文件内容大小（UTF-8字节数）
   */
  private calculateSize(content: string): number {
    return new Blob([content]).size;
  }

  /**
   * 获取数据库总大小
   */
  async getTotalSize(): Promise<number> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const records: FileHistoryRecord[] = request.result;
        const totalSize = records.reduce((sum, record) => sum + record.size, 0);
        resolve(totalSize);
      };

      request.onerror = () => {
        reject(new Error('Failed to calculate total size'));
      };
    });
  }

  /**
   * 清理旧记录以腾出空间
   */
  private async cleanupOldRecords(): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onsuccess = () => {
        const records: FileHistoryRecord[] = request.result;
        
        // 按时间排序，最新的在前
        records.sort((a, b) => b.timestamp - a.timestamp);
        
        // 按文件路径分组
        const groupedByPath = new Map<string, FileHistoryRecord[]>();
        records.forEach(record => {
          if (!groupedByPath.has(record.filePath)) {
            groupedByPath.set(record.filePath, []);
          }
          groupedByPath.get(record.filePath)!.push(record);
        });

        const recordsToDelete: string[] = [];
        let currentTotalSize = 0;

        // 为每个文件保留最多 maxRecordsPerFile 个版本
        groupedByPath.forEach((fileRecords, filePath) => {
          fileRecords.forEach((record, index) => {
            if (index >= this.maxRecordsPerFile) {
              // 超出单文件历史版本限制
              recordsToDelete.push(record.id);
            } else if (currentTotalSize + record.size > this.maxTotalSize) {
              // 超出总大小限制
              recordsToDelete.push(record.id);
            } else {
              currentTotalSize += record.size;
            }
          });
        });

        // 删除超出限制的记录
        const deletePromises = recordsToDelete.map(id => {
          return new Promise<void>((resolve, reject) => {
            const deleteRequest = store.delete(id);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(new Error(`Failed to delete record ${id}`));
          });
        });

        Promise.all(deletePromises).then(() => resolve()).catch(reject);
      };

      request.onerror = () => {
        reject(new Error('Failed to cleanup old records'));
      };
    });
  }

  /**
   * 保存文件历史版本
   */
  async saveHistory(filePath: string, fileName: string, content: string): Promise<void> {
    const db = await this.ensureDB();
    const timestamp = Date.now();
    const size = this.calculateSize(content);
    
    const record: FileHistoryRecord = {
      id: this.generateId(filePath, timestamp),
      filePath,
      fileName,
      content,
      timestamp,
      size
    };

    // 先清理旧记录
    await this.cleanupOldRecords();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(record);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to save history record'));
      };
    });
  }

  /**
   * 获取指定文件的历史版本列表
   */
  async getFileHistory(filePath: string): Promise<FileHistoryRecord[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('filePath');
      const request = index.getAll(filePath);

      request.onsuccess = () => {
        const records: FileHistoryRecord[] = request.result;
        // 按时间降序排列，最新的在前
        records.sort((a, b) => b.timestamp - a.timestamp);
        // 最多返回20个版本
        resolve(records.slice(0, this.maxRecordsPerFile));
      };

      request.onerror = () => {
        reject(new Error('Failed to get file history'));
      };
    });
  }

  /**
   * 获取指定历史记录
   */
  async getHistoryRecord(id: string): Promise<FileHistoryRecord | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to get history record'));
      };
    });
  }

  /**
   * 删除指定文件的所有历史记录
   */
  async deleteFileHistory(filePath: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('filePath');
      const request = index.getAll(filePath);

      request.onsuccess = () => {
        const records: FileHistoryRecord[] = request.result;
        const deletePromises = records.map(record => {
          return new Promise<void>((resolve, reject) => {
            const deleteRequest = store.delete(record.id);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(new Error(`Failed to delete record ${record.id}`));
          });
        });

        Promise.all(deletePromises).then(() => resolve()).catch(reject);
      };

      request.onerror = () => {
        reject(new Error('Failed to delete file history'));
      };
    });
  }

  /**
   * 清空所有历史记录
   */
  async clearAllHistory(): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear all history'));
      };
    });
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<{
    totalRecords: number;
    totalSize: number;
    fileCount: number;
  }> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const records: FileHistoryRecord[] = request.result;
        const totalSize = records.reduce((sum, record) => sum + record.size, 0);
        const uniqueFiles = new Set(records.map(record => record.filePath));

        resolve({
          totalRecords: records.length,
          totalSize,
          fileCount: uniqueFiles.size
        });
      };

      request.onerror = () => {
        reject(new Error('Failed to get storage stats'));
      };
    });
  }
}

// 导出单例实例
export const historyStorage = new HistoryStorage();
