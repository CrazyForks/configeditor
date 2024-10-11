import ConfigEditor from '@/components/view/editor'
import { Toaster } from "@/components/ui/sonner"

function App(): JSX.Element {
  return (
    <div className="fixed w-screen h-screen overflow-hidden">
      <ConfigEditor />
      <Toaster />
    </div>
  )
}

export default App
