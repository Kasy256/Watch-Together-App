import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ChakraProvider, Box, Text } from '@chakra-ui/react'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Home from './components/Home'
import CreateRoom from './components/CreateRoom'
import JoinRoom from './components/JoinRoom'
import WatchRoom from './components/WatchRoom'
import SignIn from './components/SignIn'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <ChakraProvider>
        <Box minH="100vh" bg="gray.900" display="flex" alignItems="center" justifyContent="center">
          <Text color="white">Loading...</Text>
        </Box>
      </ChakraProvider>
    )
  }

  return (
    <ChakraProvider>
      <Router>
        <Box minH="100vh" bg="white.800">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateRoom />} />
            <Route path="/join" element={<JoinRoom />} />
            <Route path="/room/:roomId" element={<WatchRoom />} />
            <Route path="/signin" element={<Navigate to="/" />} />
          </Routes>
        </Box>
      </Router>
    </ChakraProvider>
  )
}

export default App