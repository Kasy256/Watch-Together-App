import React from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Button,
  VStack,
  Text,
  useToast,
  Box,
  Heading,
  Divider,
} from '@chakra-ui/react'
import { FaGoogle } from 'react-icons/fa'
import { auth, signInWithPopup, GoogleAuthProvider } from '../firebase'

function SignIn({ isOpen, onClose, setUser, roomId }) {
  const toast = useToast()
  const provider = new GoogleAuthProvider()

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider)
      const user = {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      }
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      
      // Don't show success toast when joining room to avoid delays
      if (!roomId) {
        toast({
          title: 'Welcome!',
          description: `Signed in as ${user.displayName}`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        })
      }
      onClose()
    } catch (error) {
      console.error('Error signing in:', error)
      toast({
        title: 'Error signing in',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      isCentered 
      size="md"
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(10px)" />
      <ModalContent bg="gray.900" border="1px" borderColor="gray.700">
        <ModalBody p={8}>
          <VStack spacing={6} align="stretch">
            <Box textAlign="center">
              <Box mb={4} display="inline-block" p={3} bg="gray.800" borderRadius="full">
                <Text fontSize="3xl">📺</Text>
              </Box>
              <Heading size="lg" color="white" mb={2}>
                {roomId ? 'Join Watch Party' : 'Welcome to Watch Party'}
              </Heading>
              <Text color="gray.400">
                {roomId ? 'Sign in to join the watch party' : 'Sign in to watch together with friends'}
              </Text>
            </Box>

            <Divider borderColor="gray.700" />

            <Button
              leftIcon={<FaGoogle />}
              onClick={handleGoogleSignIn}
              size="lg"
              width="full"
              bg="white"
              color="gray.900"
              _hover={{ bg: 'gray.100' }}
              height="50px"
              fontSize="md"
              fontWeight="medium"
            >
              Continue with Google
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default SignIn 