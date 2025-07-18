import { useState, useEffect } from 'react';
import { Clock, FileText } from 'lucide-react';
import { historyStorage, FileHistoryRecord } from '../utils/history-storage';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface HistoryMenuProps {
  filePath: string;
  onSelectHistory: (record: FileHistoryRecord) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function HistoryMenu({ filePath, onSelectHistory, onMouseEnter, onMouseLeave }: HistoryMenuProps) {
  const [historyRecords, setHistoryRecords] = useState<FileHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [filePath]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const records = await historyStorage.getFileHistory(filePath);
      setHistoryRecords(records);
    } catch (error) {
      console.error('Failed to load history:', error);
      setHistoryRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number): string => {
    try {
      return formatDistanceToNow(new Date(timestamp), { 
        addSuffix: true, 
        locale: zhCN 
      });
    } catch {
      return new Date(timestamp).toLocaleString('zh-CN');
    }
  };

  return (
    <div
      className="absolute left-full top-0 ml-1 bg-content1 border border-divider rounded-lg py-1 min-w-80 max-w-96 shadow-lg z-50"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="px-3 py-2 text-xs text-default-500 border-b border-divider">
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          历史版本 ({historyRecords.length})
        </div>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="px-3 py-4 text-center text-sm text-default-500">
            加载中...
          </div>
        ) : historyRecords.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-default-500">
            暂无历史版本
          </div>
        ) : (
          historyRecords.map((record, index) => (
            <button
              key={record.id}
              className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-content2 flex items-start heroui-transition"
              onClick={() => onSelectHistory(record)}
              title={`点击查看此版本\n大小: ${formatFileSize(record.size)}\n时间: ${new Date(record.timestamp).toLocaleString('zh-CN')}`}
            >
              <div className="flex-shrink-0 mr-2 mt-0.5">
                <FileText className="h-3 w-3 text-default-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-default-500">
                    版本 #{historyRecords.length - index}
                  </span>
                  <span className="text-xs text-default-400">
                    {formatFileSize(record.size)}
                  </span>
                </div>
                <div className="text-xs text-default-600 truncate">
                  {formatTime(record.timestamp)}
                </div>
                <div className="text-xs text-default-400 truncate mt-1">
                  {new Date(record.timestamp).toLocaleString('zh-CN')}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
      
      {historyRecords.length > 0 && (
        <div className="px-3 py-2 text-xs text-default-400 border-t border-divider">
          最多保存 20 个版本
        </div>
      )}
    </div>
  );
}
