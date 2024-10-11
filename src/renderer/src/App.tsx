import ConfigEditor from '@/components/view/editor'
import { Toaster } from "@/components/ui/sonner"
import ParallaxList from './components/view/parallax-list'

function App(): JSX.Element {
  return (
    <div className="fixed w-screen h-screen overflow-hidden">
      <ConfigEditor />
      {/* <ParallaxList /> */}
      <Toaster />
    </div>
  )
}

export default App
