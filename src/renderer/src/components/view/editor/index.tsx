'use client'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { EditorHeadBar } from './comps/editor-headbar'
import { FileSidebar } from './comps/file-sidebar'
import { MonacoEditor } from './comps/monaco-editor'
import { useInitConfigEditor } from './hooks'
import { useAtom } from "jotai"
import { isLeftPanelOpenAtom } from '@/components/view/editor/store'

export default function ConfigEditor() {
  const [isLeftPanelOpen] = useAtom(isLeftPanelOpenAtom)
  useInitConfigEditor();

  return <>
    <ResizablePanelGroup
      direction="horizontal"
      className="w-screen h-screen bg-gray-100 text-gray-800 text-sm font-sans"
    >
      {isLeftPanelOpen && <>
        <ResizablePanel defaultSize={30} minSize={10}>
          <FileSidebar />
        </ResizablePanel>
      </>}
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
