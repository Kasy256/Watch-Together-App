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
  Grid,
} from '@chakra-ui/react'
import { FaArrowLeft } from 'react-icons/fa'
import { socket } from '../socket'

function CreateRoom() {
  const navigate = useNavigate()
  const toast = useToast()
  const [roomName, setRoomName] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [contentUrl, setContentUrl] = useState('')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create a room',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      navigate('/')
      return
    }
    setUser(JSON.parse(storedUser))
  }, [navigate, toast])

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a room name',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (!selectedService) {
      toast({
        title: 'Error',
        description: 'Please select a streaming service',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (selectedService === 'youtube' && !contentUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a YouTube video URL',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const roomId = Math.random().toString(36).substring(2, 8)
    const roomInfo = {
      roomId,
      roomName,
      service: selectedService,
      contentUrl,
      hostName: user?.displayName || 'Anonymous',
      hostId: user?.uid,
      hostPhoto: user?.photoURL,
      createdAt: new Date().toISOString()
    }

    socket.emit('create-room', roomInfo)

    socket.once('room-created', () => {
      localStorage.setItem('watchPartyRoom', JSON.stringify(roomInfo))
      navigate(`/room/${roomId}`)
    })

    socket.once('room-creation-error', (error) => {
      toast({
        title: 'Error creating room',
        description: error || 'Failed to create room',
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
              <Heading size="lg">Create a Watch Party</Heading>
              <Text color="gray.600">Set up your room and invite friends to watch together</Text>
            </Box>
          </HStack>

          <FormControl>
            <FormLabel>Room Name</FormLabel>
            <Input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Movie Night"
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

          <Box>
            <Text fontWeight="medium" mb={4}>Select Streaming Service</Text>
            <Grid templateColumns="repeat(3, 1fr)" gap={4}>
              <Button
                onClick={() => setSelectedService('netflix')}
                bg={selectedService === 'netflix' ? 'red.600' : 'white'}
                color={selectedService === 'netflix' ? 'white' : 'black'}
                border="1px"
                borderColor={selectedService === 'netflix' ? 'red.600' : 'gray.300'}
                _hover={{ bg: selectedService === 'netflix' ? 'red.700' : 'gray.50' }}
              >
                NETFLIX
              </Button>
              <Button
                onClick={() => setSelectedService('prime')}
                bg={selectedService === 'prime' ? 'blue.500' : 'white'}
                color={selectedService === 'prime' ? 'white' : 'black'}
                border="1px"
                borderColor={selectedService === 'prime' ? 'blue.500' : 'gray.300'}
                _hover={{ bg: selectedService === 'prime' ? 'blue.600' : 'gray.50' }}
              >
                PRIME
              </Button>
              <Button
                onClick={() => setSelectedService('disney')}
                bg={selectedService === 'disney' ? 'blue.700' : 'white'}
                color={selectedService === 'disney' ? 'white' : 'black'}
                border="1px"
                borderColor={selectedService === 'disney' ? 'blue.700' : 'gray.300'}
                _hover={{ bg: selectedService === 'disney' ? 'blue.800' : 'gray.50' }}
              >
                DISNEY+
              </Button>
              <Button
                onClick={() => setSelectedService('hulu')}
                bg={selectedService === 'hulu' ? 'green.500' : 'white'}
                color={selectedService === 'hulu' ? 'white' : 'black'}
                border="1px"
                borderColor={selectedService === 'hulu' ? 'green.500' : 'gray.300'}
                _hover={{ bg: selectedService === 'hulu' ? 'green.600' : 'gray.50' }}
              >
                HULU
              </Button>
              <Button
                onClick={() => setSelectedService('hbomax')}
                bg={selectedService === 'hbomax' ? 'purple.600' : 'white'}
                color={selectedService === 'hbomax' ? 'white' : 'black'}
                border="1px"
                borderColor={selectedService === 'hbomax' ? 'purple.600' : 'gray.300'}
                _hover={{ bg: selectedService === 'hbomax' ? 'purple.700' : 'gray.50' }}
              >
                HBO MAX
              </Button>
              <Button
                onClick={() => setSelectedService('youtube')}
                bg={selectedService === 'youtube' ? 'red.500' : 'white'}
                color={selectedService === 'youtube' ? 'white' : 'black'}
                border="1px"
                borderColor={selectedService === 'youtube' ? 'red.500' : 'gray.300'}
                _hover={{ bg: selectedService === 'youtube' ? 'red.600' : 'gray.50' }}
              >
                YOUTUBE
              </Button>
            </Grid>
          </Box>

          {selectedService && (
            <FormControl>
              <FormLabel>Content URL</FormLabel>
              <Input
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                placeholder={`https://www.${selectedService}.com/watch/`}
                size="md"
                bg="white"
                border="1px"
                borderColor="gray.300"
                _focus={{
                  borderColor: 'gray.400',
                  boxShadow: 'none'
                }}
              />
              <Text fontSize="sm" color="gray.600" mt={1}>
                Paste the URL of the movie or show you want to watch
              </Text>
            </FormControl>
          )}

          <Button
            onClick={handleCreateRoom}
            size="lg"
            colorScheme="gray"
            bg="gray.900"
            color="white"
            _hover={{ bg: 'gray.900' }}
            isDisabled={!roomName.trim() || !selectedService}
          >
            Create Room
          </Button>
        </VStack>
      </Container>
    </Box>
  )
}

export default CreateRoom 