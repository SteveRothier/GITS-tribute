import { useState } from 'react'
import Dashboard from './components/Dashboard'
import LoadingScreen from './components/LoadingScreen'
import './App.css'

function App() {
  const [isLoading, setIsLoading] = useState(true)

  const handleLoadingComplete = () => {
    setIsLoading(false)
  }

  return (
    <div className="app">
      {isLoading && (
        <LoadingScreen onComplete={handleLoadingComplete} />
      )}
      {!isLoading && (
        <Dashboard />
      )}
    </div>
  )
}

export default App
