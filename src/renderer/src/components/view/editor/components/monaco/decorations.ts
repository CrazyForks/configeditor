import * as monaco from "monaco-editor"

// 获取编辑器一些固定的元素位置
const OverviewRulerLane = monaco.editor.OverviewRulerLane;
// 定义修改类型
const ChangeType = { Modify: 0, Add: 1, Delete: 2 };
// decorations 的配置，定义标记应该在的位置
const baseOptions: monaco.editor.IModelDecorationOptions = {
  isWholeLine: true,
  linesDecorationsClassName: 'dirty-diff-glyph',
  glyphMarginClassName: 'dirty-diff-glyph',
  overviewRuler: {
    color: 'RGBA(0, 122, 204, 0.6)',
    position: OverviewRulerLane.Left,
  }
}

// 不同的 decorations 有不同的 class name，以便 css 定义样式
const modifiedOptions: monaco.editor.IModelDecorationOptions = {
  ...baseOptions,
  linesDecorationsClassName: 'dirty-diff-glyph dirty-diff-modified',
  glyphMarginClassName: 'dirty-diff-glyph dirty-diff-modified',
  overviewRuler: {
    color: 'RGBA(12, 125, 157, 0.6)',
    position: OverviewRulerLane.Left,
  }
};

const addedOptions: monaco.editor.IModelDecorationOptions = {
  ...baseOptions,
  linesDecorationsClassName: 'dirty-diff-glyph dirty-diff-added',
  glyphMarginClassName: 'dirty-diff-glyph dirty-diff-added',
  overviewRuler: {
    color: 'RGBA(88, 124, 12, 0.6)',
    position: OverviewRulerLane.Left,
  }
};

const deletedOptions: monaco.editor.IModelDecorationOptions = {
  ...baseOptions,
  linesDecorationsClassName: 'dirty-diff-glyph dirty-diff-deleted',
  glyphMarginClassName: 'dirty-diff-glyph dirty-diff-deleted',
  overviewRuler: {
    color: 'RGBA(148, 21, 27, 0.6)',
    position: OverviewRulerLane.Left,
  }
};
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
export const generateDecorations = (changes: any[]): monaco.editor.IModelDeltaDecoration[] => {
  console.log('zws[generateDecorations] Input changes:', changes)
  
  const decorations = changes.map((change) => {
    const changeType = getChangeType(change);
    const startLineNumber = change.modifiedStartLineNumber;
    const endLineNumber = change.modifiedEndLineNumber || startLineNumber;
    
    console.log('zws[generateDecorations] Processing change:', {
      changeType,
      startLineNumber,
      endLineNumber,
      change
    })
    
    let options: monaco.editor.IModelDecorationOptions;
    
    // 根据不同的修改类型，定义影响的行范围
    switch (changeType) {
      case ChangeType.Add:
        options = addedOptions;
        break;
      case ChangeType.Delete:
        options = deletedOptions;
        break;
      case ChangeType.Modify:
      default:
        options = modifiedOptions;
        break;
    }
    
    const decoration = {
      range: new monaco.Range(
        startLineNumber, 1,
        endLineNumber, 1
      ),
      options: options
    };
    
    console.log('zws[generateDecorations] Generated decoration:', decoration)
    return decoration;
  });
  
  console.log('zws[generateDecorations] Final decorations:', decorations)
  return decorations;
}
// 怎么使用
// // 计算 diff changes
// const changesSave = computeDirtyDiff(originalLines, model);
// // 根据 changes 定义装饰器
// let decorations = generateDecorations(changesSave);
// // 将装饰器更新到编辑器中
// decorationsSave = model.deltaDecorations(decorationsSave || [], decorations);