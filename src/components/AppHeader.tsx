import React from 'react'
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

export default function AppHeader() {
	const { user, logout } = useAuth()

	return (
		<AppBar position="static" sx={{ mb: 2 }}>
			<Toolbar>
				<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
					My Finance
				</Typography>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
					<Typography variant="body2">
						Welcome, {user?.email}
					</Typography>
					<Button 
						color="inherit" 
						onClick={logout}
						variant="outlined"
						sx={{ 
							borderColor: 'rgba(255,255,255,0.5)',
							'&:hover': {
								borderColor: 'white',
								backgroundColor: 'rgba(255,255,255,0.1)'
							}
						}}
					>
						Sign Out
					</Button>
				</Box>
			</Toolbar>
		</AppBar>
	)
}
