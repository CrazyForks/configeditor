import { useEffect } from 'react'
import * as monaco from "monaco-editor"
import { computeDirtyDiff } from './diff'
import { generateDecorations } from './decorations'

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
        console.log('zws[update] Diff changes:', this.changes)
        
        if (this.changes.length > 0) {
            const decorations = generateDecorations(this.changes)
            console.log('zws[update] Generated decorations:', decorations)
            this.decorations = model.deltaDecorations(this.decorations, decorations)
            console.log('zws[update] Decorations applied:', this.decorations.length, this.decorations)
        } else {
            // 如果没有变更，清除所有装饰器
            this.decorations = model.deltaDecorations(this.decorations, [])
            console.log('zws[update] 如果没有变更，清除所有装饰器')
        }
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

        // 获取变更的确切范围
        const originalStart = Math.max(0, change.originalStartLineNumber - 1)
        const originalEnd = change.originalEndLineNumber > 0 ? change.originalEndLineNumber : originalStart + 1
        const modifiedStart = Math.max(0, change.modifiedStartLineNumber - 1)
        const modifiedEnd = change.modifiedEndLineNumber > 0 ? change.modifiedEndLineNumber : modifiedStart + 1

        // 增加上下文行数，提供更好的diff视图
        const contextLines = 5
        
        // 计算原始文件的上下文范围
        const originalContextStart = Math.max(0, originalStart - contextLines)
        const originalContextEnd = Math.min(originalLines.length, originalEnd + contextLines)
        
        // 计算修改文件的上下文范围
        const modifiedContextStart = Math.max(0, modifiedStart - contextLines)
        const modifiedContextEnd = Math.min(modifiedLines.length, modifiedEnd + contextLines)

        // 获取带上下文的内容
        const originalSlice = originalLines.slice(originalContextStart, originalContextEnd)
        const modifiedSlice = modifiedLines.slice(modifiedContextStart, modifiedContextEnd)

        return {
            originalLines: originalSlice,
            modifiedLines: modifiedSlice,
            startLine: modifiedContextStart + 1, // Monaco编辑器行号从1开始
            endLine: modifiedContextEnd,
            changeStartLine: change.modifiedStartLineNumber,
            changeEndLine: change.modifiedEndLineNumber || change.modifiedStartLineNumber
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
    private filePath: string | null = null
    private updater: DiffUpdater | null = null
    private overlays: OverlayInfo[] = []
    private peekViewIndex: PeekViewInfo | null = null
    private mouseListener: monaco.IDisposable | null = null
    private currentTheme: 'light' | 'dark' | 'system' = 'system'

    // 设置主题
    setTheme(theme: 'light' | 'dark' | 'system') {
        this.currentTheme = theme
    }

    // 注册编辑器的 diff 更新器
    registerEditor(editor: monaco.editor.IStandaloneCodeEditor, originalContent: string, filePath: string) {
        if (this.filePath) {
            this.filePath = null
        }
        if (this.updater) {
            this.updater.dispose()
            this.updater = null
        }
        if (this.mouseListener) {
            this.mouseListener.dispose()
            this.mouseListener = null
        }
    
        this.filePath = filePath;
        this.updater = new DiffUpdater(editor, originalContent);
        this.mouseListener = editor.onMouseDown((e) => {
            const isValidTarget = (e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_DECORATIONS);
            const isDirtyDiffElement = /dirty-diff/.test(e.target.element?.className || '')
            if (isValidTarget && isDirtyDiffElement) {
                const lineNumber = e.target.position?.lineNumber
                if (lineNumber && this.updater) {
                    const changeIndex = this.updater.getChangeIndex(lineNumber) // 获取变更索引
                    if (changeIndex !== -1) {
                        // 展示 peek view
                        this.renderOverlay(editor, changeIndex, filePath)
                    }
                }
            }
        })
    }

    // 更新 diff
    updateDiff() {
        if (this.updater) {
            this.updater.update()
        }
    }

    // 渲染 peek view
    renderOverlay(editor: monaco.editor.IStandaloneCodeEditor, ind: number, filePath: string) {
        this.cleanOverlay()
        const model = editor.getModel()
        if (!model) return

        if (!this.updater) return

        const changeInfo = this.updater.getChangeInfo(ind)
        if (!changeInfo) return

        const { endLineNum, linesNum, changesNum, index, changeType } = changeInfo
        
        // 计算合适的高度 - VSCode风格的peekView高度
        const editorLineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight)
        const titleHeight = 35 // 标题栏高度（更新为新的高度）
        const minContentHeight = 8 * editorLineHeight // 最小8行
        const maxContentHeight = 16 * editorLineHeight // 最大16行  
        let contentHeight = Math.max(minContentHeight, Math.min(maxContentHeight, linesNum * editorLineHeight * 2))
        
        // 总高度 = 标题高度 + 内容高度
        const totalHeight = titleHeight + contentHeight
        const totalLineHeight = Math.ceil(totalHeight / editorLineHeight)

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
                afterLineNumber: endLineNum, // 在变更结束行后添加
                suppressMouseDown: true, // 禁止鼠标事件
                heightInLines: totalLineHeight,
                domNode: zoneNode,
                onDomNodeTop: (top) => { // 设置 overlay DOM 的位置
                    overlayDom.style.top = top + "px"
                },
                onComputedHeight: (height) => { // 设置 overlay DOM 的高度
                    overlayDom.style.height = height + "px"
                    // 设置编辑器容器的高度
                    const editorContainer = overlayDom.querySelector('.ubug-overlay-editor') as HTMLElement
                    if (editorContainer) {
                        editorContainer.style.height = (height - titleHeight) + "px"
                    }
                }
            })

            editor.revealLineInCenter(endLineNum) // 确保变更行在视图中心
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
        
        // 获取当前主题
        const currentTheme = this.getCurrentTheme()
        overlay.setAttribute('data-theme', currentTheme)

        const title = document.createElement('div')
        title.className = 'ubug-overlay-title'

        const nameSpan = document.createElement('span')
        nameSpan.className = 'ubug-overlay-name'
        nameSpan.textContent = `${index + 1} of ${changesNum}` // 显示当前变更索引和总变更数

        const btns = document.createElement('div')
        btns.className = 'ubug-overlay-btns'

        // 上一个按钮 - 向上箭头图标
        const prevBtn = document.createElement('div')
        prevBtn.className = 'ubug-overlay-btn ubug-overlay-btn-prev'
        prevBtn.title = 'Previous Change'
        prevBtn.onclick = () => this.showPrevChange()

        // 下一个按钮 - 向下箭头图标
        const nextBtn = document.createElement('div')
        nextBtn.className = 'ubug-overlay-btn ubug-overlay-btn-next'
        nextBtn.title = 'Next Change'
        nextBtn.onclick = () => this.showNextChange()

        // 关闭按钮 - X图标
        const closeBtn = document.createElement('div')
        closeBtn.className = 'ubug-overlay-btn ubug-overlay-btn-close'
        closeBtn.title = 'Close'
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

    // 获取当前主题
    private getCurrentTheme(): 'light' | 'dark' {
        // 首先使用设置的主题
        if (this.currentTheme === 'light') {
            return 'light'
        } else if (this.currentTheme === 'dark') {
            return 'dark'
        } else if (this.currentTheme === 'system') {
            // 检查系统主题偏好
            const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
            return isDarkMode ? 'dark' : 'light'
        }

        // 回退检查：检查document.documentElement的data-theme属性
        const documentTheme = document.documentElement.getAttribute('data-theme')
        if (documentTheme === 'dark' || documentTheme === 'light') {
            return documentTheme
        }

        // 检查body的class
        const bodyClasses = document.body.className
        if (bodyClasses.includes('dark')) {
            return 'dark'
        }
        if (bodyClasses.includes('light')) {
            return 'light'
        }

        // 检查系统主题偏好
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
        return isDarkMode ? 'dark' : 'light'
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

        if (!this.updater) return { diffEditor: undefined, originalModel: undefined, modifiedModel: undefined }

        const editorContainer = overlayDom.querySelector('.ubug-overlay-editor') as HTMLElement
        if (!editorContainer) return { diffEditor: undefined, originalModel: undefined, modifiedModel: undefined }

        const changeContent = this.updater.getChangeContent(changeIndex)
        const { originalLines, modifiedLines, startLine } = changeContent

        try {
            // 创建 diff 编辑器 - diff editor会自动继承当前的全局Monaco主题
            const diffEditor = monaco.editor.createDiffEditor(editorContainer, {
                enableSplitViewResizing: true, // 启用分割视图调整大小
                renderSideBySide: true, // 并排显示差异 (VSCode风格)
                readOnly: true, // 设置为只读模式
                scrollBeyondLastLine: false, // 禁止滚动超出最后一行
                minimap: { enabled: false },
                lineNumbers: 'on',
                glyphMargin: false, // 禁用字形边距
                folding: false, // 禁用折叠
                lineDecorationsWidth: 10, // 增加行装饰宽度，给行号和内容更多间距
                lineNumbersMinChars: 3, // 增加行号最小字符数，确保有足够空间
                scrollbar: {
                    vertical: 'auto',
                    horizontal: 'auto',
                    verticalScrollbarSize: 14,
                    horizontalScrollbarSize: 14
                },
                originalEditable: false, // 禁止编辑原始内容
                automaticLayout: true, // 自动布局
                renderOverviewRuler: false, // 隐藏概览标尺
                hideCursorInOverviewRuler: true, // 隐藏光标在概览标尺中的显示
                overviewRulerBorder: false, // 隐藏概览标尺边框
                renderWhitespace: 'selection', // 只在选择时显示空白字符
                diffCodeLens: false, // 禁用diff code lens
                ignoreTrimWhitespace: true, // 忽略修剪空白的差异
                originalAriaLabel: 'Original', // 原始内容的aria标签
                modifiedAriaLabel: 'Modified', // 修改内容的aria标签
                fontSize: editor.getOption(monaco.editor.EditorOption.fontSize), // 使用主编辑器的字体大小
                fontFamily: editor.getOption(monaco.editor.EditorOption.fontFamily), // 使用主编辑器的字体
                // 设置固定高度以支持滚动
                scrollBeyondLastColumn: 0,
            })

            // 创建模型
            const originalModel = monaco.editor.createModel(originalLines.join('\n'), model.getLanguageId())
            const modifiedModel = monaco.editor.createModel(modifiedLines.join('\n'), model.getLanguageId())

            // 设置起始行号
            originalModel.setValue(originalLines.join('\n'))
            modifiedModel.setValue(modifiedLines.join('\n'))

            diffEditor.setModel({
                original: originalModel,
                modified: modifiedModel
            })

            // 确保diff editor使用正确的主题
            // diff editor会自动继承当前的全局Monaco主题
            // 我们不应该改变全局主题，因为这会影响主编辑器
            
            // 自动调整高度和布局，延迟执行确保DOM已渲染
            setTimeout(() => {
                diffEditor.layout()
                // 滚动到变更区域
                const modifiedEditor = diffEditor.getModifiedEditor()
                if (modifiedEditor && startLine > 1) {
                    modifiedEditor.revealLineInCenter(Math.max(1, startLine))
                }
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
            this.renderOverlay(editor, newIndex, this.filePath || '')
        }
    }

    // 显示下一个变更
    private showNextChange() {
        if (!this.peekViewIndex) return

        const { ind, changesNum } = this.peekViewIndex
        const newIndex = ind < changesNum - 1 ? ind + 1 : 0

        const editor = this.overlays[0]?.editor
        if (editor) {
            this.renderOverlay(editor, newIndex, this.filePath || '')
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
        if (this.updater) {
            this.updater.dispose()
            this.updater = null
        }
        if (this.mouseListener) {
            this.mouseListener.dispose()
            this.mouseListener = null
        }
    }

    // 更新主题
    updateTheme() {
        // 只更新overlay的主题属性，不要改变Monaco Editor的全局主题
        this.overlays.forEach(({ overlayWidget }) => {
            const overlayDom = overlayWidget.getDomNode()
            if (overlayDom) {
                const currentTheme = this.getCurrentTheme()
                overlayDom.setAttribute('data-theme', currentTheme)
            }
        })
        
        // 注意：我们不更新diff editor的主题，因为这会影响全局Monaco主题
        // diff editor的主题将在下次打开peekview时使用正确的主题创建
    }

}

// 创建全局实例
export const peekViewManager = new PeekViewManager()

export function usePeekView({
    nowFilePath,
    textContent,
    editorRef,
    currentTheme
}: {
    nowFilePath: string,
    textContent: string,
    editorRef: React.RefObject<monaco.editor.IStandaloneCodeEditor | null>,
    currentTheme?: 'light' | 'dark' | 'system'
}) {
    useEffect(() => {
        if (editorRef.current && nowFilePath) {
            console.log('zws [useEffect]nowFilePath:', nowFilePath, 'content length:', textContent.length)
            // 设置主题
            if (currentTheme) {
                peekViewManager.setTheme(currentTheme)
            }
            // 使用textContent作为原始内容进行注册
            peekViewManager.registerEditor(editorRef.current, textContent, nowFilePath)
        }
    }, [nowFilePath, textContent])

    // 监听主题变化并更新peekview主题
    useEffect(() => {
        if (currentTheme) {
            peekViewManager.setTheme(currentTheme)
            peekViewManager.updateTheme()
        }
    }, [currentTheme])

    // 组件卸载时清理所有资源
    useEffect(() => {
        return () => {
            peekViewManager.dispose()
        }
    }, [])
}
