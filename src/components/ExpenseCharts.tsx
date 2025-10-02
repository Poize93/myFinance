import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Box, Typography, Paper, Button } from '@mui/material'
import type { Expense } from '../supabase'

interface ExpenseChartsProps {
	expenses: Expense[]
	allExpenses?: Expense[] // Optional: to show total vs filtered comparison
	onResetFilters?: () => void // Optional: callback to reset filters
}

interface ChartData {
	name: string
	value: number
	color: string
	[key: string]: any
}

const COLORS = [
	'#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', 
	'#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#0000ff',
	'#800080', '#008000', '#ffa500', '#ff69b4', '#40e0d0'
]

export default function ExpenseCharts({ expenses, allExpenses, onResetFilters }: ExpenseChartsProps) {
	// Calculate data for Bank Type chart
	const bankTypeData: ChartData[] = expenses.reduce((acc, expense) => {
		const existing = acc.find(item => item.name === expense.bank_type)
		if (existing) {
			existing.value += expense.amount
		} else {
			acc.push({
				name: expense.bank_type || 'Unknown',
				value: expense.amount,
				color: COLORS[acc.length % COLORS.length]
			})
		}
		return acc
	}, [] as ChartData[])

	// Calculate data for Card Type chart
	const cardTypeData: ChartData[] = expenses.reduce((acc, expense) => {
		const existing = acc.find(item => item.name === expense.card_type)
		if (existing) {
			existing.value += expense.amount
		} else {
			acc.push({
				name: expense.card_type || 'Unknown',
				value: expense.amount,
				color: COLORS[acc.length % COLORS.length]
			})
		}
		return acc
	}, [] as ChartData[])

	// Calculate data for Expense Type chart
	const expenseTypeData: ChartData[] = expenses.reduce((acc, expense) => {
		const existing = acc.find(item => item.name === expense.expense_type)
		if (existing) {
			existing.value += expense.amount
		} else {
			acc.push({
				name: expense.expense_type || 'Unknown',
				value: expense.amount,
				color: COLORS[acc.length % COLORS.length]
			})
		}
		return acc
	}, [] as ChartData[])

	const formatINR = new Intl.NumberFormat('en-IN', { 
		style: 'currency', 
		currency: 'INR', 
		maximumFractionDigits: 0 
	})

	// Check if filters are applied
	const isFiltered = allExpenses && allExpenses.length > expenses.length
	const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
	const allTotalAmount = allExpenses ? allExpenses.reduce((sum, e) => sum + e.amount, 0) : totalAmount

	const CustomTooltip = ({ active, payload }: any) => {
		if (active && payload && payload.length) {
			const data = payload[0]
			return (
				<Paper sx={{ p: 1, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
					<Typography variant="body2" sx={{ fontWeight: 'bold' }}>
						{data.name}
					</Typography>
					<Typography variant="body2">
						Amount: {formatINR.format(data.value)}
					</Typography>
					<Typography variant="body2">
						Percentage: {((data.value / expenses.reduce((sum, e) => sum + e.amount, 0)) * 100).toFixed(1)}%
					</Typography>
				</Paper>
			)
		}
		return null
	}

	const renderChart = (data: ChartData[], title: string) => {
		if (data.length === 0) {
			return (
				<Paper elevation={1} sx={{ p: 3, height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<Typography variant="body2" color="text.secondary">
						No data available for {title}
					</Typography>
				</Paper>
			)
		}

		return (
			<Paper elevation={1} sx={{ p: 3, height: 500 }}>
				<Typography variant="h5" sx={{ mb: 2, textAlign: 'center', fontWeight: 'bold' }}>
					{title}
				</Typography>
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie
							data={data}
							cx="50%"
							cy="50%"
							labelLine={false}
							label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
							outerRadius={100}
							fill="#8884d8"
							dataKey="value"
						>
							{data.map((entry, index) => (
								<Cell key={`cell-${index}`} fill={entry.color} />
							))}
						</Pie>
						<Tooltip content={<CustomTooltip />} />
						<Legend 
							verticalAlign="bottom" 
							height={36}
							iconType="circle"
							wrapperStyle={{
								paddingTop: '20px',
								fontSize: '14px',
								fontWeight: 'bold'
							}}
							formatter={(value, entry) => (
								<span style={{ 
									color: '#333', 
									fontSize: '13px', 
									fontWeight: '600',
									marginLeft: '8px'
								}}>
									{value}
								</span>
							)}
						/>
					</PieChart>
				</ResponsiveContainer>
			</Paper>
		)
	}

	// Show message if no filtered data
	if (expenses.length === 0) {
		return (
			<Box sx={{ mt: 4 }}>
				<Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
					Expense Analysis Charts
				</Typography>
				<Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
					<Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
						No expenses found with the current filters
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Try adjusting your date range or filter criteria to see expense data
					</Typography>
				</Paper>
			</Box>
		)
	}

	return (
		<Box sx={{ mt: 4 }}>
			<Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
				Expense Analysis Charts
			</Typography>
			
			{/* Filter Information */}
			{isFiltered && (
				<Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: 'rgba(25, 118, 210, 0.08)' }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
						<Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
							📊 Showing filtered data: {expenses.length} of {allExpenses?.length} expenses
						</Typography>
						<Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
							<Typography variant="body2" color="text.secondary">
								Filtered Total: <strong>{formatINR.format(totalAmount)}</strong>
							</Typography>
							<Typography variant="body2" color="text.secondary">
								All Expenses: <strong>{formatINR.format(allTotalAmount)}</strong>
							</Typography>
							{onResetFilters && (
								<Button
									variant="outlined"
									size="small"
									onClick={onResetFilters}
									sx={{ 
										borderColor: 'error.main',
										color: 'error.main',
										'&:hover': {
											borderColor: 'error.dark',
											backgroundColor: 'error.light',
											color: 'error.dark'
										}
									}}
								>
									Reset Filters
								</Button>
							)}
						</Box>
					</Box>
				</Paper>
			)}

			<Box  component="div" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
				<Box  component="div">
					{renderChart(bankTypeData, 'Bank Type Distribution')}
				</Box>
				<Box  component="div">
					{renderChart(cardTypeData, 'Card Type Distribution')}
				</Box>
				<Box  component="div" sx={{ gridColumn: { xs: 'auto', md: '1 / span 2' } }}>
					{renderChart(expenseTypeData, 'Expense Type Distribution')}
				</Box>
			</Box>
		</Box>
	)
}
