import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Grid,
  GridItem,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  useToast,
  IconButton,
  Heading,
  Avatar,
  AvatarGroup,
  Tooltip,
  Badge,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Center,
  Spinner
} from '@chakra-ui/react'
import { FaArrowLeft, FaPaperPlane, FaCog, FaLink, FaVideo } from 'react-icons/fa'
import { io } from 'socket.io-client'
import SignIn from './SignIn'

// Get the server URL from environment or use default
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
const socket = io(SERVER_URL)

function WatchRoom() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: !localStorage.getItem('user') })
  const videoRef = useRef(null)
  const chatContainerRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [participants, setParticipants] = useState([])
  const [roomInfo, setRoomInfo] = useState(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [player, setPlayer] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingUsers, setPendingUsers] = useState([])
  const [acceptedUsers, setAcceptedUsers] = useState([])

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      onOpen() // Show sign-in modal
      return
    }

    const parsedUser = JSON.parse(storedUser)
    setUser(parsedUser)

    // Join the room immediately after getting user info
    socket.emit('join-room', {
      roomId,
      userName: parsedUser.displayName,
      userId: parsedUser.uid,
      userPhoto: parsedUser.photoURL
    })

    socket.on('room-joined', (info) => {
      setRoomInfo(info)
      setIsLoading(false) // Stop loading when room info is received
    })

    socket.on('room-not-found', () => {
      toast({
        title: 'Room not found',
        description: 'The room you\'re trying to join doesn\'t exist',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      navigate('/')
    })

    // Handle join request response
    socket.on('join-request-pending', () => {
      toast({
        title: 'Waiting for approval',
        description: 'The room creator needs to accept your request to join',
        status: 'info',
        duration: null,
        isClosable: true,
      })
    })

    socket.on('join-request-accepted', (info) => {
      setRoomInfo(info)
      setIsLoading(false)
      toast({
        title: 'Welcome!',
        description: 'Your request to join has been accepted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    })

    socket.on('join-request-rejected', () => {
      toast({
        title: 'Request rejected',
        description: 'The room creator has rejected your request to join',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      navigate('/')
    })

    // For room creator: receive join requests
    socket.on('new-join-request', (userData) => {
      if (roomInfo?.hostId === user?.uid) {
        setPendingUsers(prev => [...prev, userData])
        toast({
          title: 'New join request',
          description: `${userData.userName} wants to join`,
          status: 'info',
          duration: null,
          isClosable: true,
          action: (
            <HStack spacing={2}>
              <Button size="sm" colorScheme="green" 
                onClick={() => handleAcceptUser(userData)}>
                Accept
              </Button>
              <Button size="sm" colorScheme="red" 
                onClick={() => handleRejectUser(userData)}>
                Reject
              </Button>
            </HStack>
          ),
        })
      }
    })

    socket.on('user-joined', (user) => {
      toast({
        title: 'New user joined',
        description: `${user} joined the room`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
    })

    socket.on('user-left', (user) => {
      toast({
        title: 'User left',
        description: `${user} left the room`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
    })

    socket.on('video-state-update', (data) => {
      console.log('Received video state update:', data)
      if (!data || !data.state || !player) return

      try {
        const { currentTime, isPlaying, playbackRate } = data.state
        const currentPlayerTime = player.getCurrentTime()
        const timeDiff = Math.abs(currentPlayerTime - currentTime)

        // Only update if the time difference is significant (more than 1 second)
        if (timeDiff > 1) {
          player.seekTo(currentTime)
        }

        // Update playback state
        if (isPlaying && player.getPlayerState() !== window.YT.PlayerState.PLAYING) {
          player.playVideo()
        } else if (!isPlaying && player.getPlayerState() === window.YT.PlayerState.PLAYING) {
          player.pauseVideo()
        }

        // Update playback rate if different
        if (player.getPlaybackRate() !== playbackRate) {
          player.setPlaybackRate(playbackRate)
        }
      } catch (error) {
        console.error('Error updating video state:', error)
      }
    })

    socket.on('chat-message', (message) => {
      setMessages((prev) => [...prev, message])
    })

    return () => {
      socket.off('room-joined')
      socket.off('room-not-found')
      socket.off('join-request-pending')
      socket.off('join-request-accepted')
      socket.off('join-request-rejected')
      socket.off('new-join-request')
      socket.off('user-joined')
      socket.off('user-left')
      socket.off('video-state-update')
      socket.off('chat-message')
      if (player) {
        player.destroy()
      }
      // Clean up YouTube API script
      const script = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
      if (script) {
        script.remove()
      }
    }
  }, [roomId, navigate, toast])

  const initializeYouTubePlayer = (videoId) => {
    console.log('Initializing YouTube player with video ID:', videoId)
    if (!videoId) {
      console.error('No video ID provided')
      toast({
        title: 'Invalid video URL',
        description: 'Please provide a valid YouTube video URL',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    // Clean up existing player
    if (player) {
      player.destroy()
    }

    // Clean up existing script
    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
    if (existingScript) {
      existingScript.remove()
    }

    // Load YouTube IFrame API
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube API Ready')
      const newPlayer = new window.YT.Player('youtube-player', {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          enablejsapi: 1,
          origin: window.location.origin,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          disablekb: roomInfo?.hostId !== user?.uid,
        },
        events: {
          onReady: (event) => {
            console.log('YouTube player ready')
            setPlayer(event.target)
            setIsVideoLoaded(true)
            
            // If we're the host, send initial state after player is ready
            if (roomInfo?.hostId === user?.uid) {
              setTimeout(() => {
                const state = {
                  currentTime: event.target.getCurrentTime(),
                  isPlaying: event.target.getPlayerState() === window.YT.PlayerState.PLAYING,
                  playbackRate: event.target.getPlaybackRate(),
                  videoId
                }
                socket.emit('video-state', { roomId, state })
              }, 1000)
            }
          },
          onStateChange: (event) => {
            console.log('YouTube player state changed:', event.data)
            if (roomInfo?.hostId === user?.uid) {
              handleVideoStateChange(event)
            }
          },
          onError: (event) => {
            console.error('YouTube player error:', event.data)
            toast({
              title: 'Error loading video',
              description: 'There was an error loading the YouTube video. Please check the URL and try again.',
              status: 'error',
              duration: 5000,
              isClosable: true,
            })
          },
        },
      })
    }
  }

  const handleVideoStateChange = (event) => {
    if (!roomId || !player || roomInfo?.hostId !== user?.uid) return
    
    try {
      const state = {
        currentTime: player.getCurrentTime(),
        isPlaying: event.data === window.YT.PlayerState.PLAYING,
        playbackRate: player.getPlaybackRate(),
        videoId: extractYouTubeVideoId(roomInfo.contentUrl)
      }
      socket.emit('video-state', { roomId, state })
    } catch (error) {
      console.error('Error handling video state change:', error)
    }
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !roomId) return

    socket.emit('chat-message', { roomId, message: newMessage })
    setMessages(prev => [...prev, { userId: socket.id, message: newMessage }])
    setNewMessage('')
  }

  const copyRoomLink = () => {
    const link = window.location.href
    navigator.clipboard.writeText(link)
    toast({
      title: 'Link copied!',
      description: 'Share this link with friends to watch together',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const extractYouTubeVideoId = (url) => {
    if (!url) return null
    console.log('Extracting video ID from URL:', url)
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    const videoId = match && match[2].length === 11 ? match[2] : null
    console.log('Extracted video ID:', videoId)
    return videoId
  }

  const getEmbedUrl = (service, url) => {
    if (!url) return null

    switch (service) {
      case 'youtube':
        const videoId = extractYouTubeVideoId(url)
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null
      case 'netflix':
        // Extract Netflix video ID from URL
        const netflixMatch = url.match(/watch\/([^?]+)/)
        return netflixMatch ? `https://www.netflix.com/embed/${netflixMatch[1]}` : null
      case 'prime':
        // Extract Prime Video ID from URL
        const primeMatch = url.match(/detail\/([^?]+)/)
        return primeMatch ? `https://www.primevideo.com/embed/${primeMatch[1]}` : null
      case 'disney':
        // Extract Disney+ video ID from URL
        const disneyMatch = url.match(/video\/([^?]+)/)
        return disneyMatch ? `https://www.disneyplus.com/embed/${disneyMatch[1]}` : null
      case 'hulu':
        // Extract Hulu video ID from URL
        const huluMatch = url.match(/video\/([^?]+)/)
        return huluMatch ? `https://www.hulu.com/embed/${huluMatch[1]}` : null
      case 'hbomax':
        // Extract HBO Max video ID from URL
        const hboMatch = url.match(/video\/([^?]+)/)
        return hboMatch ? `https://www.max.com/embed/${hboMatch[1]}` : null
      default:
        return null
    }
  }

  const handleAcceptUser = (userData) => {
    socket.emit('accept-join-request', { roomId, userData })
    setPendingUsers(prev => prev.filter(u => u.userId !== userData.userId))
    setAcceptedUsers(prev => [...prev, userData])
  }

  const handleRejectUser = (userData) => {
    socket.emit('reject-join-request', { roomId, userData })
    setPendingUsers(prev => prev.filter(u => u.userId !== userData.userId))
  }

  if (isLoading && user) {
    return (
      <Center minH="100vh" bg="gray.50">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.600">Joining room...</Text>
        </VStack>
      </Center>
    )
  }

  if (!roomInfo) {
    return (
      <Box minH="100vh" bg="gray.900" color="white">
        <Container maxW="container.xl" py={8}>
          <Text>Loading room information...</Text>
        </Container>
      </Box>
    )
  }

  return (
    <Box>
      <Box minH="100vh" bg="gray.900">
        <Container maxW="container.xl" py={4}>
          <Grid templateColumns="repeat(12, 1fr)" gap={6}>
            {/* Video Section */}
            <GridItem colSpan={{ base: 12, lg: 8 }}>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <HStack>
                    <IconButton
                      icon={<FaArrowLeft />}
                      variant="ghost"
                      color="white"
                      onClick={() => navigate('/')}
                      aria-label="Go back"
                    />
                    <Box>
                      <Heading size="md" color="white">
                        {roomInfo?.roomName || 'Watch Party'}
                      </Heading>
                      <Text color="gray.400" fontSize="sm">
                        Hosted by {roomInfo?.hostName || 'Anonymous'}
                      </Text>
                    </Box>
                  </HStack>
                  <HStack>
                    <Button
                      leftIcon={<FaLink />}
                      variant="ghost"
                      color="white"
                      onClick={copyRoomLink}
                    >
                      Share
                    </Button>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FaCog />}
                        variant="ghost"
                        color="white"
                      />
                      <MenuList>
                        <MenuItem icon={<FaVideo />}>Video Settings</MenuItem>
                      </MenuList>
                    </Menu>
                  </HStack>
                </HStack>

                <Box
                  bg="gray.800"
                  borderRadius="xl"
                  overflow="hidden"
                  position="relative"
                  paddingTop="56.25%"
                >
                  {roomInfo.service === 'youtube' ? (
                    <div
                      id="youtube-player"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'black',
                        pointerEvents: roomInfo?.hostId === user?.uid ? 'auto' : 'none',
                        opacity: roomInfo?.hostId === user?.uid ? 1 : 0.8,
                        zIndex: roomInfo?.hostId === user?.uid ? 2 : 1
                      }}
                    />
                  ) : (
                    <iframe
                      src={getEmbedUrl(roomInfo.service, roomInfo.contentUrl)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        pointerEvents: roomInfo?.hostId === user?.uid ? 'auto' : 'none',
                        opacity: roomInfo?.hostId === user?.uid ? 1 : 0.8,
                        zIndex: roomInfo?.hostId === user?.uid ? 2 : 1
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      onLoad={() => setIsVideoLoaded(true)}
                    />
                  )}
                  {!isVideoLoaded && (
                    <Box
                      position="absolute"
                      top="50%"
                      left="50%"
                      transform="translate(-50%, -50%)"
                      bg="black"
                      p={4}
                      borderRadius="md"
                      zIndex={3}
                    >
                      <Text color="white">Loading video...</Text>
                    </Box>
                  )}
                  {roomInfo?.hostId !== user?.uid && (
                    <Box
                      position="absolute"
                      top="10px"
                      right="10px"
                      bg="black"
                      p={2}
                      borderRadius="md"
                      opacity={0.8}
                      zIndex={3}
                    >
                      <Text color="white" fontSize="sm">Host controls video</Text>
                    </Box>
                  )}
                </Box>
              </VStack>
            </GridItem>

            {/* Chat Section */}
            <GridItem colSpan={{ base: 12, lg: 4 }}>
              <Box
                bg="gray.800"
                borderRadius="xl"
                h="full"
                p={4}
                display="flex"
                flexDirection="column"
              >
                <VStack spacing={4} h="full">
                  <HStack w="full" justify="space-between">
                    <Heading size="md" color="white">Watch Party Chat</Heading>
                    <AvatarGroup size="sm" max={3}>
                      {participants.map((id) => (
                        <Tooltip key={id} label={`User ${id.slice(0, 4)}`}>
                          <Avatar
                            name={`User ${id.slice(0, 4)}`}
                            bg="brand.300"
                          />
                        </Tooltip>
                      ))}
                    </AvatarGroup>
                  </HStack>

                  <Divider borderColor="gray.600" />

                  <Box
                    ref={chatContainerRef}
                    flex="1"
                    overflowY="auto"
                    w="full"
                    css={{
                      '&::-webkit-scrollbar': {
                        width: '4px',
                      },
                      '&::-webkit-scrollbar-track': {
                        width: '6px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'gray.500',
                        borderRadius: '24px',
                      },
                    }}
                  >
                    <VStack spacing={4} align="stretch">
                      {messages.map((msg, index) => (
                        <Box
                          key={index}
                          bg={msg.userId === socket.id ? 'brand.500' : 'gray.700'}
                          p={3}
                          borderRadius="lg"
                          alignSelf={msg.userId === socket.id ? 'flex-end' : 'flex-start'}
                          maxW="80%"
                        >
                          <Text fontSize="xs" color="gray.400" mb={1}>
                            {msg.userId === socket.id ? 'You' : `User ${msg.userId.slice(0, 4)}`}
                          </Text>
                          <Text color="white">{msg.message}</Text>
                        </Box>
                      ))}
                    </VStack>
                  </Box>

                  <HStack w="full">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      bg="gray.700"
                      border="none"
                      color="white"
                      _placeholder={{ color: 'gray.400' }}
                      _focus={{
                        border: 'none',
                        ring: 1,
                        ringColor: 'brand.300',
                      }}
                    />
                    <IconButton
                      icon={<FaPaperPlane />}
                      onClick={sendMessage}
                      colorScheme="brand"
                      aria-label="Send message"
                    />
                  </HStack>
                </VStack>
              </Box>
            </GridItem>
          </Grid>
        </Container>
      </Box>

      <SignIn 
        isOpen={isOpen} 
        onClose={() => {
          onClose()
          if (!user) {
            navigate('/')
          }
        }} 
        setUser={(newUser) => {
          setUser(newUser)
          setIsLoading(true) // Show loading when joining after sign in
          socket.emit('join-room', {
            roomId,
            userName: newUser.displayName,
            userId: newUser.uid,
            userPhoto: newUser.photoURL
          })
        }}
        roomId={roomId}
      />

      {/* Add pending users section for room creator */}
      {roomInfo?.hostId === user?.uid && pendingUsers.length > 0 && (
        <Box position="fixed" top={4} right={4} zIndex={10}>
          <VStack 
            bg="gray.800" 
            p={4} 
            borderRadius="xl" 
            spacing={3}
            boxShadow="xl"
          >
            <Heading size="sm" color="white">Pending Requests</Heading>
            {pendingUsers.map(pendingUser => (
              <HStack key={pendingUser.userId} spacing={3}>
                <Avatar 
                  size="sm" 
                  src={pendingUser.userPhoto} 
                  name={pendingUser.userName} 
                />
                <Text color="white">{pendingUser.userName}</Text>
                <Button 
                  size="sm" 
                  colorScheme="green"
                  onClick={() => handleAcceptUser(pendingUser)}
                >
                  Accept
                </Button>
                <Button 
                  size="sm" 
                  colorScheme="red"
                  onClick={() => handleRejectUser(pendingUser)}
                >
                  Reject
                </Button>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  )
}

export default WatchRoom 