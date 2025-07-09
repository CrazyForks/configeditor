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
import { useEffect, useRef } from "react"
import { ImperativePanelHandle } from "react-resizable-panels"

export default function ConfigEditor() {
  useInitConfigEditor();
  const [isLeftPanelOpen] = useAtom(isLeftPanelOpenAtom);
  const resizablePanelRef = useRef<ImperativePanelHandle>(null);

  useEffect(() => {
    if (resizablePanelRef.current) {
      console.log('Resizable panel ref is set:', resizablePanelRef.current);
      if (isLeftPanelOpen) {
        resizablePanelRef.current.expand();
      } else {
        resizablePanelRef.current.collapse();
      }
    }
  }, [isLeftPanelOpen]);

  return <>
    <ResizablePanelGroup
      direction="horizontal"
      className="w-screen h-screen bg-background text-foreground text-sm font-sans"
    >
      <ResizablePanel
        ref={resizablePanelRef}
        defaultSize={30}
        collapsedSize={0}
        collapsible={true}
        minSize={10}
      >
        <FileSidebar />
      </ResizablePanel>
      <ResizableHandle className="w-px bg-border hover:bg-default heroui-transition" />
      <ResizablePanel 
        defaultSize={70}
        minSize={10}
      >
        <div className='w-full h-full bg-content1 dark:bg-content2 flex flex-col'>
          <EditorHeadBar />
          <MonacoEditor />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
    <DebugPanel />
  </>
}
