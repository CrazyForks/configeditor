import * as monaco from "monaco-editor"
import { computeDirtyDiff } from './diff'
import { generateDecorations } from './decorations'
import { useEffect } from "react"

interface PeekViewInfo {
    path: string
    ind: number
    changesNum: number
}

interface OverlayInfo {
    zone: string
    editor: monaco.editor.IStandaloneCodeEditor
    overlayWidget: monaco.editor.IOverlayWidget
    index: number
}

interface ChangeInfo {
    endLineNum: number
    linesNum: number
    changesNum: number
    index: number
    changeType: number
}

// Diff 更新器类
class DiffUpdater {
    private editor: monaco.editor.IStandaloneCodeEditor
    private originalContent: string
    private filePath: string
    private decorations: string[] = []
    private changes: any[] = []

    constructor(editor: monaco.editor.IStandaloneCodeEditor, originalContent: string, filePath: string) {
        this.editor = editor
        this.originalContent = originalContent
        this.filePath = filePath
        this.update()
    }

    update() {
        const model = this.editor.getModel()
        if (!model) return

        const originalLines = this.originalContent.split('\n')
        this.changes = computeDirtyDiff(originalLines, model)

        const decorations = generateDecorations(this.changes)
        this.decorations = model.deltaDecorations(this.decorations, decorations)
    }

    getChangeIndex(lineNumber: number): number {
        return this.changes.findIndex(change => {
            const start = change.modifiedStartLineNumber
            const end = change.modifiedEndLineNumber || start
            return lineNumber >= start && lineNumber <= end
        })
    }

    getChangeInfo(index: number): ChangeInfo | null {
        if (index < 0 || index >= this.changes.length) return null

        const change = this.changes[index]
        const endLineNum = change.modifiedEndLineNumber || change.modifiedStartLineNumber
        const linesNum = Math.abs(endLineNum - change.modifiedStartLineNumber) + 1
        const changeType = this.getChangeType(change)

        return {
            endLineNum,
            linesNum,
            changesNum: this.changes.length,
            index,
            changeType
        }
    }

    getChangeContent(index: number) {
        const change = this.changes[index]
        const originalLines = this.originalContent.split('\n')
        const model = this.editor.getModel()
        const modifiedLines = model?.getLinesContent() || []

        const originalStart = change.originalStartLineNumber - 1
        const originalEnd = change.originalEndLineNumber || originalStart + 1
        const modifiedStart = change.modifiedStartLineNumber - 1
        const modifiedEnd = change.modifiedEndLineNumber || modifiedStart + 1

        const contextLines = 3
        const originalSlice = originalLines.slice(
            Math.max(0, originalStart - contextLines),
            originalEnd + contextLines
        )
        const modifiedSlice = modifiedLines.slice(
            Math.max(0, modifiedStart - contextLines),
            modifiedEnd + contextLines
        )

        return {
            originalLines: originalSlice,
            modifiedLines: modifiedSlice,
            startLine: Math.max(1, change.modifiedStartLineNumber - contextLines),
            endLine: (change.modifiedEndLineNumber || change.modifiedStartLineNumber) + contextLines
        }
    }

    private getChangeType(change: any): number {
        if (change.originalEndLineNumber === 0) return 1 // Add
        if (change.modifiedEndLineNumber === 0) return 2 // Delete
        return 0 // Modify
    }

    dispose() {
        const model = this.editor.getModel()
        if (model) {
            model.deltaDecorations(this.decorations, [])
        }
    }
}

export class PeekViewManager {
    private updaters: { [path: string]: DiffUpdater } = {}
    private overlays: OverlayInfo[] = []
    private peekViewIndex: PeekViewInfo | null = null

    // 注册编辑器的 diff 更新器
    registerEditor(editor: monaco.editor.IStandaloneCodeEditor, originalContent: string, filePath: string) {
        this.updaters[filePath] = new DiffUpdater(editor, originalContent, filePath)

        // 添加鼠标点击监听
        editor.onMouseDown((e) => {
            if (e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_DECORATIONS &&
                /dirty-diff/.test(e.target.element?.className || '')) {
                const lineNumber = e.target.position?.lineNumber
                if (lineNumber && this.updaters[filePath]) {
                    const changeIndex = this.updaters[filePath].getChangeIndex(lineNumber)
                    if (changeIndex !== -1) {
                        this.renderOverlay(editor, changeIndex)
                    }
                }
            }
        })
    }

    // 更新 diff
    updateDiff(filePath: string) {
        if (this.updaters[filePath]) {
            this.updaters[filePath].update()
        }
    }

    // 渲染 peek view
    renderOverlay(editor: monaco.editor.IStandaloneCodeEditor, ind: number) {
        this.cleanOverlay()
        const model = editor.getModel()
        if (!model) return

        const filePath = model.uri.toString()
        const updater = this.updaters[filePath]
        if (!updater) return

        const changeInfo = updater.getChangeInfo(ind)
        if (!changeInfo) return

        const { endLineNum, linesNum, changesNum, index, changeType } = changeInfo
        let lineHeight = linesNum * 2 + 3 * 2
        lineHeight = lineHeight > 14 ? 14 : (lineHeight < 8 ? 8 : lineHeight)

        this.peekViewIndex = { path: filePath, ind, changesNum }

        // 创建 overlay DOM
        const overlayDom = this.createOverlayWidget(index, changesNum, changeType, filePath)
        this.fixOverlayWidth(editor.getLayoutInfo(), overlayDom)

        // 添加 overlay widget
        const overlayWidget: monaco.editor.IOverlayWidget = {
            getId: () => `${filePath} - ${index}`,
            getDomNode: () => overlayDom,
            getPosition: () => null
        }
        editor.addOverlayWidget(overlayWidget)

        // 添加 view zone
        const zoneNode = document.createElement('div')
        zoneNode.style.background = 'transparent'

        editor.changeViewZones((changeAccessor) => {
            const viewZoneId = changeAccessor.addZone({
                afterLineNumber: endLineNum,
                suppressMouseDown: true,
                heightInLines: lineHeight + 1,
                domNode: zoneNode,
                onDomNodeTop: (top) => {
                    overlayDom.style.top = top + "px"
                },
                onComputedHeight: (height) => {
                    overlayDom.style.height = height + "px"
                }
            })

            editor.revealLineInCenter(endLineNum)
            this.renderDiffEditorAtDom(editor, ind, overlayDom)
            this.overlays.push({ zone: viewZoneId, editor, overlayWidget, index })
        })
    }

    // 创建 overlay widget DOM
    private createOverlayWidget(index: number, changesNum: number, changeType: number, filePath: string): HTMLElement {
        const overlay = document.createElement('div')
        overlay.className = `ubug-overlay ubug-overlay-type-${changeType}`

        const title = document.createElement('div')
        title.className = 'ubug-overlay-title'

        const nameSpan = document.createElement('span')
        nameSpan.className = 'ubug-overlay-name'
        nameSpan.textContent = `${index + 1}/${changesNum}`

        const btns = document.createElement('div')
        btns.className = 'ubug-overlay-btns'

        // 上一个按钮
        const prevBtn = document.createElement('div')
        prevBtn.className = 'ubug-overlay-btn'
        prevBtn.textContent = '↑'
        prevBtn.onclick = () => this.showPrevChange()

        // 下一个按钮
        const nextBtn = document.createElement('div')
        nextBtn.className = 'ubug-overlay-btn'
        nextBtn.textContent = '↓'
        nextBtn.onclick = () => this.showNextChange()

        // 关闭按钮
        const closeBtn = document.createElement('div')
        closeBtn.className = 'ubug-overlay-btn'
        closeBtn.textContent = '×'
        closeBtn.onclick = () => this.cleanOverlay()

        btns.appendChild(prevBtn)
        btns.appendChild(nextBtn)
        btns.appendChild(closeBtn)

        title.appendChild(nameSpan)
        title.appendChild(btns)

        const editorContainer = document.createElement('div')
        editorContainer.className = 'ubug-overlay-editor'

        overlay.appendChild(title)
        overlay.appendChild(editorContainer)

        return overlay
    }

    // 修正 overlay 宽度
    private fixOverlayWidth(layoutInfo: monaco.editor.EditorLayoutInfo, overlayDom: HTMLElement) {
        const maxWidth = layoutInfo.width - (layoutInfo.minimapWidth || 0) - 20
        overlayDom.style.width = maxWidth + 'px'
        overlayDom.style.left = '10px'
    }

    // 在 overlay 中渲染 diff 编辑器
    private renderDiffEditorAtDom(editor: monaco.editor.IStandaloneCodeEditor, changeIndex: number, overlayDom: HTMLElement) {
        const model = editor.getModel()
        if (!model) return

        const filePath = model.uri.toString()
        const updater = this.updaters[filePath]
        if (!updater) return

        const editorContainer = overlayDom.querySelector('.ubug-overlay-editor') as HTMLElement
        if (!editorContainer) return

        const { originalLines, modifiedLines, startLine, endLine } = updater.getChangeContent(changeIndex)

        // 创建 diff 编辑器
        const diffEditor = monaco.editor.createDiffEditor(editorContainer, {
            enableSplitViewResizing: false,
            renderSideBySide: false,
            readOnly: true,
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            lineNumbers: 'on',
            glyphMargin: false,
            folding: false,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 3,
            scrollbar: {
                vertical: 'hidden',
                horizontal: 'hidden'
            }
        })

        // 创建模型
        const originalModel = monaco.editor.createModel(originalLines.join('\n'), model.getLanguageId())
        const modifiedModel = monaco.editor.createModel(modifiedLines.join('\n'), model.getLanguageId())

        diffEditor.setModel({
            original: originalModel,
            modified: modifiedModel
        })

        // 自动调整高度
        setTimeout(() => {
            diffEditor.layout()
        }, 100)
    }

    // 显示上一个变更
    private showPrevChange() {
        if (!this.peekViewIndex) return

        const { path, ind, changesNum } = this.peekViewIndex
        const newIndex = ind > 0 ? ind - 1 : changesNum - 1

        const editor = this.overlays[0]?.editor
        if (editor) {
            this.renderOverlay(editor, newIndex)
        }
    }

    // 显示下一个变更
    private showNextChange() {
        if (!this.peekViewIndex) return

        const { path, ind, changesNum } = this.peekViewIndex
        const newIndex = ind < changesNum - 1 ? ind + 1 : 0

        const editor = this.overlays[0]?.editor
        if (editor) {
            this.renderOverlay(editor, newIndex)
        }
    }

    // 清理 overlay
    cleanOverlay() {
        this.overlays.forEach(({ zone, editor, overlayWidget }) => {
            editor.removeOverlayWidget(overlayWidget)
            editor.changeViewZones((changeAccessor) => {
                changeAccessor.removeZone(zone)
            })
        })
        this.overlays = []
        this.peekViewIndex = null
    }

    // 清理所有资源
    dispose() {
        this.cleanOverlay()
        Object.values(this.updaters).forEach(updater => updater.dispose())
        this.updaters = {}
    }
}

// 创建全局实例
export const peekViewManager = new PeekViewManager()

export function usePeekView({
    nowFilePath,
    textContent,
    editorRef
}: {
    nowFilePath: string,
    textContent: string,
    editorRef: React.RefObject<monaco.editor.IStandaloneCodeEditor | null>
}) {
    useEffect(() => {
        if (editorRef.current && nowFilePath && textContent) {
            peekViewManager.registerEditor(editorRef.current, textContent, nowFilePath)
        }
    }, [nowFilePath, textContent])

    // 组件卸载时清理资源
    useEffect(() => {
        return () => {
            peekViewManager.dispose()
        }
    }, [])

}
