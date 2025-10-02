import React, { useState } from 'react'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Container
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { supabaseDb } from '../supabaseDb'
import type { LoginCredentials, RegisterData } from '../types/auth'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const LoginForm: React.FC = () => {
  const { login, register, isLoading } = useAuth()
  const [tabValue, setTabValue] = useState(0)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loginIdError, setLoginIdError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Login form state
  const [loginForm, setLoginForm] = useState<LoginCredentials>({
    loginId: '',
    password: ''
  })

  // Register form state
  const [registerForm, setRegisterForm] = useState<RegisterData>({
    loginId: '',
    password: '',
    name: '',
    email: ''
  })

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
    setMessage(null)
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setLoginIdError(null)
    setPasswordError(null)

    if (!loginForm.loginId || !loginForm.password) {
      setMessage({ type: 'error', text: 'Please fill in all fields' })
      return
    }

    const result = await login(loginForm)
    setMessage({ type: result.success ? 'success' : 'error', text: result.message })

    if (!result.success) {
      if (result.message === 'User does not exist') {
        setLoginIdError('No account found with this Login ID')
      } else if (result.message === 'Incorrect password') {
        setPasswordError('Incorrect password')
      }
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!registerForm.loginId || !registerForm.password || !registerForm.name) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    if (registerForm.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' })
      return
    }

    const result = await register(registerForm)
    setMessage({ type: result.success ? 'success' : 'error', text: result.message })
  }

  const testConnection = async () => {
    const result = await supabaseDb.testConnection()
    setMessage({ type: result.success ? 'success' : 'error', text: result.message })
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          py: 4
        }}
      >
        <Paper
          elevation={10}
          sx={{
            width: '100%',
            maxWidth: 500,
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="auth tabs">
              <Tab label="Login" />
              <Tab label="Register" />
            </Tabs>
          </Box>

          {message && (
            <Box sx={{ p: 2 }}>
              <Alert severity={message.type}>{message.text}</Alert>
            </Box>
          )}

          <TabPanel value={tabValue} index={0}>
            <Box component="form" onSubmit={handleLoginSubmit}>
              <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
                Welcome Back
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
                Sign in to your Finance Manager account
              </Typography>

              <TextField
                fullWidth
                label="Login ID"
                value={loginForm.loginId}
                onChange={(e) => setLoginForm({ ...loginForm, loginId: e.target.value })}
                margin="normal"
                required
                autoComplete="username"
                error={!!loginIdError}
                helperText={loginIdError || undefined}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                margin="normal"
                required
                autoComplete="current-password"
                error={!!passwordError}
                helperText={passwordError || undefined}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>

              <Button
                type="button"
                fullWidth
                variant="outlined"
                size="small"
                onClick={testConnection}
                sx={{ mb: 1 }}
              >
                Test Supabase Connection
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box component="form" onSubmit={handleRegisterSubmit}>
              <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
                Create Account
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
                Start managing your finances today
              </Typography>

              <TextField
                fullWidth
                label="Full Name"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                margin="normal"
                required
                autoComplete="name"
              />

              <TextField
                fullWidth
                label="Login ID"
                value={registerForm.loginId}
                onChange={(e) => setRegisterForm({ ...registerForm, loginId: e.target.value })}
                margin="normal"
                required
                autoComplete="username"
                helperText="Choose a unique login ID"
              />

              <TextField
                fullWidth
                label="Email (Optional)"
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                margin="normal"
                autoComplete="email"
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                margin="normal"
                required
                autoComplete="new-password"
                helperText="Minimum 6 characters"
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Create Account'}
              </Button>
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  )
}

export default LoginForm
