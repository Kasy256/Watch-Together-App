import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'white',
        color: 'gray.900'
      }
    }
  },
  colors: {
    netflix: { 500: '#E50914' },
    prime: { 500: '#00A8E1' },
    disney: { 500: '#113CCF' },
    hulu: { 500: '#1CE783' },
    hbomax: { 500: '#741CE7' },
    other: { 500: '#718096' }
  },
  components: {
    Button: {
      variants: {
        solid: {
          bg: 'black',
          color: 'white',
          _hover: {
            bg: 'gray.800',
          },
        },
        outline: {
          borderColor: 'gray.300',
          color: 'gray.700',
          _hover: {
            bg: 'gray.50',
          },
        },
        streaming: {
          height: '36px',
          minW: '100px',
          border: '1px solid',
          borderColor: 'gray.200',
          borderRadius: 'md',
          _hover: {
            borderColor: 'gray.400',
          },
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderColor: 'gray.200',
            _hover: {
              borderColor: 'gray.300',
            },
            _focus: {
              borderColor: 'gray.400',
              boxShadow: 'none',
            },
          },
        },
      },
      defaultProps: {
        variant: 'outline',
      },
    },
  },
})

export default theme 