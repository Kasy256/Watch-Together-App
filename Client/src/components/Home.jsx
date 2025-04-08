import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  VStack,
  Text,
  useToast,
  HStack,
  Image,
  SimpleGrid,
  Flex,
  Link,
  Spacer,
  useDisclosure
} from '@chakra-ui/react'
import { socket } from '../socket'
import SignIn from './SignIn'

const getServiceColor = (name) => {
  const colors = {
    Netflix: '#E50914',
    Prime: '#00A8E1',
    Disney: '#113CCF',
    Hulu: '#1CE783',
    HBOMax: '#A635E6',
    YouTube: '#FF0000'
  }
  return colors[name] || 'gray.500'
}

const StreamingService = ({ name }) => (
  <Button
    variant="solid"
    bg={getServiceColor(name)}
    color="white"
    _hover={{ opacity: 0.9 }}
    textTransform="uppercase"
    fontWeight="bold"
    px={6}
    py={2}
    fontSize="sm"
    borderRadius="md"
  >
    {name}
  </Button>
)

const StepCard = ({ number, title, description }) => (
  <Box textAlign="center" p={6}>
    <Text
      w="36px"
      h="36px"
      borderRadius="full"
      bg="gray.100"
      display="flex"
      alignItems="center"
      justifyContent="center"
      fontSize="lg"
      fontWeight="bold"
      mb={4}
      mx="auto"
    >
      {number}
    </Text>
    <Heading size="md" mb={2}>
      {title}
    </Heading>
    <Text color="gray.600">
      {description}
    </Text>
  </Box>
)

function Home() {
  const navigate = useNavigate()
  const toast = useToast()
  const [user, setUser] = useState(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [roomId, setRoomId] = useState('')

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem('user')
    setUser(null)
    toast({
      title: 'Signed out successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleNavigation = (path) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to continue',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      onOpen()
      return
    }
    navigate(path)
  }

  const joinRoom = () => {
    if (!roomId) {
      toast({
        title: 'Error',
        description: 'Please enter a room ID',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    socket.emit('join-room', roomId)
    socket.on('room-joined', () => {
      handleNavigation(`/room/${roomId}`)
    })
    socket.on('room-not-found', () => {
      toast({
        title: 'Error',
        description: 'Room not found',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    })
  }

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" py={4} shadow="sm">
        <Container maxW="container.lg">
          <Flex align="center">
            <HStack>
              <Box as="span" fontSize="xl" fontWeight="bold">
                📺 Watch Party
              </Box>
            </HStack>
            <Spacer />
            {user ? (
              <HStack spacing={4}>
                <Text color="gray.600">Welcome, {user.displayName}</Text>
                <Button onClick={handleSignOut} variant="ghost" colorScheme="gray">
                  Sign Out
                </Button>
              </HStack>
            ) : (
              <Button onClick={onOpen} colorScheme="blue">
                Sign In
              </Button>
            )}
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={20}>
        <Box display="flex" alignItems="center" gap={20}>
          <Box flex={1}>
            <Heading
              as="h1"
              size="2xl"
              lineHeight="1.2"
              mb={6}
            >
              Watch Together,<br />
              Anywhere
            </Heading>
            <Text fontSize="xl" color="gray.600" mb={8}>
              Synchronize Netflix, Amazon Prime, Disney+ and more with friends
              and family. Chat, react, and enjoy movies together, even when
              you're apart.
            </Text>
            <HStack spacing={4}>
              <Button onClick={() => handleNavigation('/create')} size="lg" bg="gray.900" color="white" _hover={{ bg: 'gray.600' }}>
                Create a Room
              </Button>
              <Input
                placeholder="12345"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                maxW="130px"
                textAlign="center"
                size="lg"
              />
              <Button variant="outline" onClick={joinRoom} size="lg" bg="gray.600" color="white" _hover={{ bg: 'gray.900' }}>
                Join Room
              </Button>
            </HStack>
            <Box mt={8}>
              <Text color="gray.600" mb={3}>Works with</Text>
              <HStack spacing={3}>
                <StreamingService name="Netflix" />
                <StreamingService name="Prime" />
                <StreamingService name="Disney" />
                <StreamingService name="Hulu" />
                <StreamingService name="HBOMax" />
                <StreamingService name="YouTube" />
              </HStack>
            </Box>
          </Box>
          <Box flex={1}>
            <Box
              bg="gray.100"
              borderRadius="xl"
              h="400px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="gray.500">Preview Image</Text>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* SignIn Modal */}
      <SignIn isOpen={isOpen} onClose={onClose} setUser={setUser} />
    </Box>
  )
}

export default Home