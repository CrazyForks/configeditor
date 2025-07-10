import { DiffComputer } from 'monaco-editor/esm/vs/editor/common/diff/legacyLinesDiffComputer';

// 计算函数
export const computeDirtyDiff = (originalLines, modifiedModel) => {
  // 边界条件处理
  if (!modifiedModel || modifiedModel.getValue() === '') return [];
  // 获取编辑器当前的实际内容
  let modifiedLines = modifiedModel.getLinesContent();
  
  // 利用内置的计算能力进行输出
  let diffComputer = new DiffComputer(originalLines, modifiedLines, {
    shouldComputeCharChanges: false,  // 不需要字符级别的差异
    shouldPostProcessCharChanges: false,  // 不进行字符差异后处理
    shouldIgnoreTrimWhitespace: true,     // 忽略首尾空格差异，更像VSCode行为
    shouldMakePrettyDiff: true,           // 调整 diff 更符合直觉
    maxComputationTimeMs: 5000, // 最大计算时间，单位毫秒
  });
  
  const result = diffComputer.computeDiff();
  const changes = result.changes || [];
  
  // 转换为VSCode风格的change格式
  return changes.map(change => {
    return {
      originalStartLineNumber: change.originalStartLineNumber,
      originalEndLineNumber: change.originalEndLineNumber,
      modifiedStartLineNumber: change.modifiedStartLineNumber,
      modifiedEndLineNumber: change.modifiedEndLineNumber,
      // 添加类型标识，便于后续处理
      changeType: getChangeType(change)
    };
  });
};

// 获取变更类型
function getChangeType(change) {
  if (change.originalEndLineNumber === 0) {
    return 'insert'; // 插入
  } else if (change.modifiedEndLineNumber === 0) {
    return 'delete'; // 删除
  } else {
    return 'modify'; // 修改
  }
}
// 结果举例：
// [
//   {
//     "originalStartLineNumber": 24,
//     "originalEndLineNumber": 0,
//     "modifiedStartLineNumber": 25,
//     "modifiedEndLineNumber": 25
//   },
//   {
//     "originalStartLineNumber": 31,
//     "originalEndLineNumber": 31,
//     "modifiedStartLineNumber": 32,
//     "modifiedEndLineNumber": 32
//   },
//   {
//     "originalStartLineNumber": 34,
//     "originalEndLineNumber": 0,
//     "modifiedStartLineNumber": 36,
//     "modifiedEndLineNumber": 36
//   },
//   {
//     "originalStartLineNumber": 38,
//     "originalEndLineNumber": 38,
//     "modifiedStartLineNumber": 39,
//     "modifiedEndLineNumber": 0
//   }
// ]
