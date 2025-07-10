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
    diffEditor?: monaco.editor.IStandaloneDiffEditor
    originalModel?: monaco.editor.ITextModel
    modifiedModel?: monaco.editor.ITextModel
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
    private decorations: string[] = []
    private changes: any[] = []

    constructor(editor: monaco.editor.IStandaloneCodeEditor, originalContent: string) {
        this.editor = editor
        this.originalContent = originalContent
        this.update()
    }

    update() {
        const model = this.editor.getModel()
        if (!model) return

        const originalLines = this.originalContent.split('\n')
        this.changes = computeDirtyDiff(originalLines, model)
        console.log('zws Diff changes:', this.changes.length, this.changes)
        
        if (this.changes.length > 0) {
            const decorations = generateDecorations(this.changes)
            console.log('zws Generated decorations:', decorations)
            this.decorations = model.deltaDecorations(this.decorations, decorations)
            console.log('zws Decorations applied:', this.decorations.length, this.decorations)
            
            // 验证装饰器是否真的被应用了
            const currentDecorations = model.getAllDecorations()
            const dirtyDiffDecorations = currentDecorations.filter(d => 
                d.options.linesDecorationsClassName?.includes('dirty-diff')
            )
            console.log('zws Current dirty diff decorations in model:', dirtyDiffDecorations.length, dirtyDiffDecorations)
        } else {
            // 如果没有变更，清除所有装饰器
            this.decorations = model.deltaDecorations(this.decorations, [])
            console.log('zws No changes, cleared decorations')
        }
    }

    updateOriginalContent(newContent: string) {
        this.originalContent = newContent
        this.update()
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
        if (!change) return { originalLines: [], modifiedLines: [], startLine: 1, endLine: 1 }
        
        const originalLines = this.originalContent.split('\n')
        const model = this.editor.getModel()
        const modifiedLines = model?.getLinesContent() || []

        const originalStart = Math.max(0, change.originalStartLineNumber - 1)
        const originalEnd = change.originalEndLineNumber > 0 ? change.originalEndLineNumber : originalStart
        const modifiedStart = Math.max(0, change.modifiedStartLineNumber - 1)
        const modifiedEnd = change.modifiedEndLineNumber > 0 ? change.modifiedEndLineNumber : modifiedStart

        const contextLines = 3
        const originalSlice = originalLines.slice(
            Math.max(0, originalStart - contextLines),
            Math.min(originalLines.length, originalEnd + contextLines)
        )
        const modifiedSlice = modifiedLines.slice(
            Math.max(0, modifiedStart - contextLines),
            Math.min(modifiedLines.length, modifiedEnd + contextLines)
        )

        return {
            originalLines: originalSlice,
            modifiedLines: modifiedSlice,
            startLine: Math.max(1, change.modifiedStartLineNumber - contextLines),
            endLine: Math.min(modifiedLines.length, (change.modifiedEndLineNumber || change.modifiedStartLineNumber) + contextLines)
        }
    }

    private getChangeType(change: any): number {
        if (change.originalEndLineNumber === 0) return 1 // Add
        if (change.modifiedEndLineNumber === 0) return 2 // Delete
        return 0 // Modify
    }

    // 获取所有变更 (公共方法)
    getChanges() {
        return this.changes
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
    private mouseListeners: { [path: string]: monaco.IDisposable } = {}

    // 注册编辑器的 diff 更新器
    registerEditor(editor: monaco.editor.IStandaloneCodeEditor, originalContent: string, filePath: string) {
        // 如果已经注册过，先清理旧的
        if (this.updaters[filePath]) {
            this.updaters[filePath].dispose()
        }
        if (this.mouseListeners[filePath]) {
            this.mouseListeners[filePath].dispose()
        }

        this.updaters[filePath] = new DiffUpdater(editor, originalContent)

        // 添加鼠标点击监听
        this.mouseListeners[filePath] = editor.onMouseDown((e) => {
            console.log('zws Mouse down event:', {
                targetType: e.target.type,
                targetTypeName: monaco.editor.MouseTargetType[e.target.type],
                className: e.target.element?.className,
                lineNumber: e.target.position?.lineNumber,
                isDirtyDiff: /dirty-diff/.test(e.target.element?.className || ''),
                element: e.target.element
            })
            
            // 检查多种可能的点击目标类型
            const isValidTarget = (
                e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_DECORATIONS ||
                e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN ||
                e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS
            )
            
            const isDirtyDiffElement = /dirty-diff/.test(e.target.element?.className || '')
            
            if (isValidTarget && isDirtyDiffElement) {
                const lineNumber = e.target.position?.lineNumber
                if (lineNumber && this.updaters[filePath]) {
                    const changeIndex = this.updaters[filePath].getChangeIndex(lineNumber)
                    console.log('zws Change index for line', lineNumber, ':', changeIndex)
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

    // 更新原始内容
    updateOriginalContent(filePath: string, originalContent: string) {
        if (this.updaters[filePath]) {
            this.updaters[filePath].updateOriginalContent(originalContent)
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
        const overlayDom = this.createOverlayWidget(index, changesNum, changeType)
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
            const overlayData = this.renderDiffEditorAtDom(editor, ind, overlayDom)
            this.overlays.push({ 
                zone: viewZoneId, 
                editor, 
                overlayWidget, 
                index,
                diffEditor: overlayData.diffEditor,
                originalModel: overlayData.originalModel,
                modifiedModel: overlayData.modifiedModel
            })
        })
    }

    // 创建 overlay widget DOM
    private createOverlayWidget(index: number, changesNum: number, changeType: number): HTMLElement {
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
        const maxWidth = layoutInfo.width - (layoutInfo.minimap.minimapWidth || 0) - 20
        overlayDom.style.width = maxWidth + 'px'
        overlayDom.style.left = '10px'
    }

    // 在 overlay 中渲染 diff 编辑器
    private renderDiffEditorAtDom(editor: monaco.editor.IStandaloneCodeEditor, changeIndex: number, overlayDom: HTMLElement) {
        const model = editor.getModel()
        if (!model) return { diffEditor: undefined, originalModel: undefined, modifiedModel: undefined }

        const filePath = model.uri.toString()
        const updater = this.updaters[filePath]
        if (!updater) return { diffEditor: undefined, originalModel: undefined, modifiedModel: undefined }

        const editorContainer = overlayDom.querySelector('.ubug-overlay-editor') as HTMLElement
        if (!editorContainer) return { diffEditor: undefined, originalModel: undefined, modifiedModel: undefined }

        const changeContent = updater.getChangeContent(changeIndex)
        const { originalLines, modifiedLines } = changeContent

        try {
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
                    vertical: 'auto',
                    horizontal: 'auto'
                },
                originalEditable: false,
                automaticLayout: true
            })

            // 创建模型
            const originalModel = monaco.editor.createModel(originalLines.join('\n'), model.getLanguageId())
            const modifiedModel = monaco.editor.createModel(modifiedLines.join('\n'), model.getLanguageId())

            diffEditor.setModel({
                original: originalModel,
                modified: modifiedModel
            })

            // 自动调整高度和布局
            setTimeout(() => {
                diffEditor.layout()
            }, 100)

            return { diffEditor, originalModel, modifiedModel }
        } catch (error) {
            console.error('zws Error creating diff editor:', error)
            return { diffEditor: undefined, originalModel: undefined, modifiedModel: undefined }
        }
    }

    // 显示上一个变更
    private showPrevChange() {
        if (!this.peekViewIndex) return

        const { ind, changesNum } = this.peekViewIndex
        const newIndex = ind > 0 ? ind - 1 : changesNum - 1

        const editor = this.overlays[0]?.editor
        if (editor) {
            this.renderOverlay(editor, newIndex)
        }
    }

    // 显示下一个变更
    private showNextChange() {
        if (!this.peekViewIndex) return

        const { ind, changesNum } = this.peekViewIndex
        const newIndex = ind < changesNum - 1 ? ind + 1 : 0

        const editor = this.overlays[0]?.editor
        if (editor) {
            this.renderOverlay(editor, newIndex)
        }
    }

    // 清理 overlay
    cleanOverlay() {
        this.overlays.forEach(({ zone, editor, overlayWidget, diffEditor, originalModel, modifiedModel }) => {
            editor.removeOverlayWidget(overlayWidget)
            editor.changeViewZones((changeAccessor) => {
                changeAccessor.removeZone(zone)
            })
            
            // 清理 diff 编辑器和模型
            if (diffEditor) {
                diffEditor.dispose()
            }
            if (originalModel) {
                originalModel.dispose()
            }
            if (modifiedModel) {
                modifiedModel.dispose()
            }
        })
        this.overlays = []
        this.peekViewIndex = null
    }

    // 清理所有资源
    dispose() {
        this.cleanOverlay()
        Object.values(this.updaters).forEach(updater => updater.dispose())
        Object.values(this.mouseListeners).forEach(listener => listener.dispose())
        this.updaters = {}
        this.mouseListeners = {}
    }

    // 手动触发 peek view (用于调试)
    showPeekViewForLine(filePath: string, lineNumber: number) {
        const updater = this.updaters[filePath]
        if (!updater) {
            console.log('zws No updater found for path:', filePath)
            return
        }
        
        const changeIndex = updater.getChangeIndex(lineNumber)
        console.log('zws Manual trigger - Change index for line', lineNumber, ':', changeIndex)
        
        if (changeIndex !== -1) {
            // 找到对应的编辑器
            const editorEntry = Object.entries(this.mouseListeners).find(([path]) => path === filePath)
            if (editorEntry) {
                // 这里我们需要找到编辑器实例，但我们没有直接的引用
                // 所以我们需要修改架构来支持这个功能
                console.log('zws Found editor for manual trigger')
            }
        }
    }

    // 获取文件的所有变更信息 (用于调试)
    getFileChanges(filePath: string) {
        const updater = this.updaters[filePath]
        if (!updater) return []
        
        return updater.getChanges().map((change: any, index: number) => ({
            index,
            change,
            changeInfo: updater.getChangeInfo(index)
        }))
    }

    // 清理特定文件的资源
    disposeFile(filePath: string) {
        if (this.updaters[filePath]) {
            this.updaters[filePath].dispose()
            delete this.updaters[filePath]
        }
        if (this.mouseListeners[filePath]) {
            this.mouseListeners[filePath].dispose()
            delete this.mouseListeners[filePath]
        }
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
            console.log('zws Registering editor for peekview:', nowFilePath)
            console.log('zws Original content length:', textContent.length)
            console.log('zws Editor model URI:', editorRef.current.getModel()?.uri.toString())
            
            // 使用textContent作为原始内容进行注册
            peekViewManager.registerEditor(editorRef.current, textContent, nowFilePath)
            
            // 立即检查编辑器当前内容与原始内容的差异
            const model = editorRef.current.getModel()
            if (model) {
                const currentContent = model.getValue()
                console.log('zws Current editor content length:', currentContent.length)
                console.log('zws Content differs:', currentContent !== textContent)
                
                if (currentContent !== textContent) {
                    // 如果内容已经不同，立即触发更新
                    setTimeout(() => {
                        console.log('zws Triggering diff update due to content difference')
                        peekViewManager.updateDiff(nowFilePath)
                    }, 100)
                }
            }
        }
    }, [nowFilePath, editorRef.current, textContent])

    // 组件卸载时清理所有资源
    useEffect(() => {
        return () => {
            peekViewManager.dispose()
        }
    }, [])
}
