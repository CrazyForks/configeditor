import * as monaco from "monaco-editor"

// 获取编辑器一些固定的元素位置
const OverviewRulerLane = monaco.editor.OverviewRulerLane;
// 定义修改类型
const ChangeType = { Modify: 0, Add: 1, Delete: 2 };
// decorations 的配置，定义标记应该在的位置
const baseOptions = {
  isWholeLine: true,
  linesDecorationsClassName: 'dirty-diff-glyph',
  overviewRuler: {
    color: 'RGBA(0, 122, 204, 0.6)',
    position: OverviewRulerLane.Left,
  }
}
// 不同的 decorations 有不同的 class name，以便 css 定义样式
const modifiedOptions = Object.assign({
  linesDecorationsClassName: 'dirty-diff-glyph dirty-diff-modified',
  overviewRuler: {
    color: 'RGBA(12, 125, 157, 0.6)',
    position: OverviewRulerLane.Left,
  }
}, baseOptions);
const addedOptions = Object.assign({
  linesDecorationsClassName: 'dirty-diff-glyph dirty-diff-added',
  overviewRuler: {
    color: 'RGBA(88, 124, 12, 0.6)',
    position: OverviewRulerLane.Left,
  }
}, baseOptions);
const deletedOptions = Object.assign({
  linesDecorationsClassName: 'dirty-diff-glyph dirty-diff-deleted',
  overviewRuler: {
    color: 'RGBA(148, 21, 27, 0.6)',
    position: OverviewRulerLane.Left,
  }
}, baseOptions);
// 根据不同的数据，能解析为不同的修改类型
function getChangeType(change) {
  if (change.originalEndLineNumber === 0) {           // 新增行
    return ChangeType.Add;
  } else if (change.modifiedEndLineNumber === 0) {    // 删除行
    return ChangeType.Delete;
  } else {                                            // 其他的都是修改
    return ChangeType.Modify;
  }
}
// 根据上面的 diffChanges 进行转换
export const generateDecorations = (changes) => {
  const decorations = changes.map((change) => {
    const changeType = getChangeType(change);
    const startLineNumber = change.modifiedStartLineNumber;
    const endLineNumber = change.modifiedEndLineNumber || startLineNumber;
    // 根据不同的修改类型，定义影响的行范围
    switch (changeType) {
      case ChangeType.Add:
        return {
          range: {
            startLineNumber: startLineNumber, startColumn: 1,
            endLineNumber: endLineNumber, endColumn: 1
          },
          options: addedOptions
        };
      case ChangeType.Delete:
        return {
          range: {
            startLineNumber: startLineNumber, startColumn: 1,
            endLineNumber: startLineNumber, endColumn: 1
          },
          options: deletedOptions
        };
      case ChangeType.Modify:
      default:
        return {
          range: {
            startLineNumber: startLineNumber, startColumn: 1,
            endLineNumber: endLineNumber, endColumn: 1
          },
          options: modifiedOptions
        };
    }
  });
  return decorations;
}
// 怎么使用
// // 计算 diff changes
// const changesSave = computeDirtyDiff(originalLines, model);
// // 根据 changes 定义装饰器
// let decorations = generateDecorations(changesSave);
// // 将装饰器更新到编辑器中
// decorationsSave = model.deltaDecorations(decorationsSave || [], decorations);