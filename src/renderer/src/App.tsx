import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'
import ConfigEditor from '@/components/view/editor'
import ParallaxList from './components/view/parallax-list'

function App(): JSX.Element {
  return (
    <div className="fixed w-screen h-screen overflow-hidden">
      {/* <ConfigEditor /> */}
      <ParallaxList />
    </div>
  )
}

export default App
