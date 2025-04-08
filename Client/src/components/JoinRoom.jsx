import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  VStack,
  Text,
  useToast,
  HStack,
  IconButton,
} from '@chakra-ui/react'
import { FaArrowLeft } from 'react-icons/fa'
import { socket } from '../socket'

function JoinRoom() {
  const navigate = useNavigate()
  const toast = useToast()
  const [roomId, setRoomId] = useState('')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to join a room',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      navigate('/')
      return
    }
    setUser(JSON.parse(storedUser))
  }, [navigate, toast])

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a room ID',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    socket.emit('join-room', {
      roomId,
      userName: user?.displayName || 'Anonymous',
      userId: user?.uid,
      userPhoto: user?.photoURL
    })

    socket.on('room-joined', (roomInfo) => {
      localStorage.setItem('watchPartyRoom', JSON.stringify(roomInfo))
      navigate(`/room/${roomId}`)
    })

    socket.on('room-not-found', () => {
      toast({
        title: 'Room not found',
        description: 'Please check the room ID and try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    })
  }

  return (
    <Box minH="100vh" bg="white">
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="stretch">
          <HStack>
            <IconButton
              icon={<FaArrowLeft />}
              variant="ghost"
              onClick={() => navigate('/')}
              aria-label="Go back"
            />
            <Box>
              <Heading size="lg">Join a Watch Party</Heading>
              <Text color="gray.600">Enter the room ID to join your friends</Text>
            </Box>
          </HStack>

          <FormControl>
            <FormLabel>Room ID</FormLabel>
            <Input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID"
              size="md"
              bg="white"
              border="1px"
              borderColor="gray.300"
              _focus={{
                borderColor: 'gray.400',
                boxShadow: 'none'
              }}
            />
          </FormControl>

          <Button
            onClick={handleJoinRoom}
            size="lg"
            colorScheme="gray"
            bg="gray.900"
            color="white"
            _hover={{ bg: 'gray.900' }}
            isDisabled={!roomId.trim()}
          >
            Join Room
          </Button>
        </VStack>
      </Container>
    </Box>
  )
}

export default JoinRoom 