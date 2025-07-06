'use client'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { EditorHeadBar } from './components/editor-headbar'
import { FileSidebar } from './components/file-sidebar'
import { MonacoEditor } from './components/monaco-editor'
import { DebugPanel } from './components/debug-panel'
import { useInitConfigEditor } from './hooks'
import { useAtom } from 'jotai'
import { isLeftPanelOpenAtom } from './store'

export default function ConfigEditor() {
  useInitConfigEditor();
  const [isLeftPanelOpen] = useAtom(isLeftPanelOpenAtom);

  return <>
    <ResizablePanelGroup
      key={`panel-group-${isLeftPanelOpen}`}
      direction="horizontal"
      className="w-screen h-screen bg-gray-100 text-gray-800 text-sm font-sans"
    >
      {isLeftPanelOpen && (
        <>
          <ResizablePanel defaultSize={30} minSize={10}>
            <FileSidebar />
          </ResizablePanel>
          <ResizableHandle />
        </>
      )}
      <ResizablePanel defaultSize={isLeftPanelOpen ? 70 : 100} minSize={10}>
        <div className='w-full h-full bg-gray-50 flex flex-col'>
          <EditorHeadBar />
          <MonacoEditor />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
    <DebugPanel />
  </>
}
