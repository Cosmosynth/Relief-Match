import './App.css'
import AppRouter from './components/router/AppRouter'
import { AuthProvider } from './context/AuthContext'
import { isFirebaseConfigured } from './firebase/firebase'

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}

export default App
