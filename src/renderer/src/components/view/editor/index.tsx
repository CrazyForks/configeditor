'use client'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { EditorHeadBar } from './components/editor-headbar'
import { FileSidebar } from './components/file-sidebar'
import { MonacoEditor } from './components/monaco-editor'
import { useInitConfigEditor } from './hooks'

export default function ConfigEditor() {
  useInitConfigEditor();

  return <>
    <ResizablePanelGroup
      direction="horizontal"
      className="w-screen h-screen bg-gray-100 text-gray-800 text-sm font-sans"
    >
      <ResizablePanel defaultSize={30} minSize={10}>
        <FileSidebar />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={70} minSize={10}>
        <div className='w-full h-full bg-gray-50 flex flex-col'>
          <EditorHeadBar />
          <MonacoEditor />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  </>
}
