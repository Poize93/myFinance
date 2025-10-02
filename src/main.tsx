import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { AuthProvider } from './contexts/AuthContext'

const theme = createTheme({
	palette: {
		mode: 'light',
		primary: { main: '#5b6ef5' },
		secondary: { main: '#00b894' },
		background: { default: '#f7f8fc' },
	},
	shape: { borderRadius: 12 },
	typography: {
		fontFamily: 'Inter, Roboto, system-ui, -apple-system, Segoe UI, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial',
	},
})

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<AuthProvider>
				<App />
			</AuthProvider>
		</ThemeProvider>
	</React.StrictMode>
)
