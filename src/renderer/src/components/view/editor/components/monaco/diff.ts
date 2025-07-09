// 因为我们引入的是 amd 规范的 monaco-editor，这里能直接用 require 引入内部的组件（如果是 webpack 需要单独 import 打包）
const diffComputer = require('monaco-editor/esm/vs/editor/common/diff/diffComputer.js');

// 具体的计算逻辑
const DiffComputer = diffComputer.DiffComputer;
// 计算函数
export const computeDirtyDiff = (originalLines, modifiedModel) => {
  // 边界条件处理
  if (!modifiedModel || modifiedModel.getValue() === '') return [];
  // 获取编辑器当前的实际内容
  let modifiedLines = modifiedModel.getLinesContent();
  // 利用内置的计算能力进行输出
  let diffComputer = new DiffComputer(originalLines, modifiedLines, {
        shouldComputeCharChanges: false,  // 不需要字符级别的差异（行级别和字符级别）
    shouldPostProcessCharChanges: false,  // 后置处理字符差异
    shouldIgnoreTrimWhitespace: false,    // 是否忽略首尾空格差异
    shouldMakePrettyDiff: true            // 调整 diff 更符合直觉
  });
  return diffComputer.computeDiff();
};
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
