import React, { useEffect, useState } from 'react'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { Dayjs } from 'dayjs'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import TableFooter from '@mui/material/TableFooter'
import Typography from '@mui/material/Typography'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { supabaseDb } from './supabaseDb'
import { isSupabaseConfigured } from './supabase'
import type { Expense, Investment } from './supabase'
import ProtectedRoute from './components/ProtectedRoute'
import AppHeader from './components/AppHeader'
import ExpenseCharts from './components/ExpenseCharts'
import InvestmentCharts from './components/InvestmentCharts'
import { useAuth } from './contexts/AuthContext'
 

type AddableSelectProps = {
	label: string
	value: string
	options: string[]
	onChange: (value: string) => void
	onAddOption: (value: string) => void
	onDeleteOption: (value: string) => void
	newValue: string
	setNewValue: (value: string) => void
	placeholder: string
}

function AddableSelect({
	label,
	value,
	options,
	onChange,
	onAddOption,
	onDeleteOption,
	newValue,
	setNewValue,
	placeholder,
}: AddableSelectProps) {
	const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)

	function commitNewOption() {
		const trimmed = newValue.trim()
		if (!trimmed) return
		onAddOption(trimmed)
		onChange(trimmed)
		setNewValue('')
		setIsMenuOpen(false)
	}

	return (
		<FormControl fullWidth size="small">
			<InputLabel id={`${label}-label`} shrink>
				{label}
			</InputLabel>
			<Select
				id={`${label}-select`}
				labelId={`${label}-label`}
				label={label}
				value={value}
				renderValue={(selected) => {
					if (!selected) {
						return <span style={{ opacity: 0.6 }}>Select {label}</span>
					}
					return <span>{selected as string}</span>
				}}
				onChange={(e) => onChange(e.target.value as string)}
				open={isMenuOpen}
				onOpen={() => setIsMenuOpen(true)}
				onClose={() => setIsMenuOpen(false)}
				MenuProps={{
					PaperProps: {
											onMouseDown: (e: React.MouseEvent) => {
						e.stopPropagation()
					},
					},
				}}
			>
				{options.map((opt) => (
					<MenuItem key={opt} value={opt}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
							<span>{opt}</span>
							<IconButton
								size="small"
								color="error"
								aria-label={`Remove ${opt}`}
								onClick={(e) => {
									e.preventDefault()
									e.stopPropagation()
									onDeleteOption(opt)
								}}
							>
								<CloseRoundedIcon fontSize="small" />
							</IconButton>
						</Box>
					</MenuItem>
				))}
				<Divider />
				<MenuItem
					disableRipple
					disableTouchRipple
					disableGutters
					sx={{ py: 1, px: 2 }}
					onClick={(e) => e.stopPropagation()}
				>
					<Box
						sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
						onClick={(e) => e.stopPropagation()}
						onMouseDown={(e) => e.stopPropagation()}
					>
						<TextField
							size="small"
							label={`Add ${label}`}
							placeholder={placeholder}
							value={newValue}
							onChange={(e) => setNewValue(e.target.value)}
							onKeyDown={(e) => {
								// Prevent Select's built-in type-to-select from hijacking typing
								e.stopPropagation()
								if (e.key === 'Enter') {
									e.preventDefault()
									commitNewOption()
								}
							}}
							fullWidth
						/>
						<Button variant="contained" onClick={commitNewOption} sx={{ whiteSpace: 'nowrap' }}>
							Add
						</Button>
					</Box>
				</MenuItem>
			</Select>
		</FormControl>
	)
}

// Using the Expense type from supabase.ts

export function App() {
	// Toggle between expenses, investments, and total assets
	const [mode, setMode] = useState<'expenses' | 'investments' | 'totalAssets'>('expenses')
	const { user, isAuthenticated } = useAuth()
	
	// Toggle between table and charts view for expenses
	const [expenseViewMode, setExpenseViewMode] = useState<'table' | 'charts'>('table')
	
	// Toggle between table and charts view for investments
	const [investmentViewMode, setInvestmentViewMode] = useState<'table' | 'charts'>('table')
	
	const [date, setDate] = useState<Dayjs | null>(dayjs())
	const [amount, setAmount] = useState<string>('')
	const [remark, setRemark] = useState<string>('')
	const [showAll, setShowAll] = useState<boolean>(false)

	// Expense-specific state
	const [bankType, setBankType] = useState<string>('')
	const [cardType, setCardType] = useState<string>('')
	const [expenseType, setExpenseType] = useState<string>('')

	// Investment-specific state
	const [investmentMode, setInvestmentMode] = useState<string>('')
	const [investmentType, setInvestmentType] = useState<string>('')
	const [currentValue, setCurrentValue] = useState<string>('')
	const [investmentAmount, setInvestmentAmount] = useState<string>('')

	// Total Assets cutoff date
	const [totalAssetsCutoffDate, setTotalAssetsCutoffDate] = useState<Dayjs | null>(dayjs())

	const [bankTypeOptions, setBankTypeOptions] = useState<string[]>([
		'Checking',
		'Savings',
		'Credit Union',
		'Digital Wallet',
	])

	const [cardTypeOptions, setCardTypeOptions] = useState<string[]>([
		'Debit',
		'Credit',
		'Prepaid',
		'Virtual',
	])

	const [expenseTypeOptions, setExpenseTypeOptions] = useState<string[]>([
		'Food',
		'Transport',
		'Bills',
		'Entertainment',
		'Shopping',
		'Travel',
		'Health',
		'Other',
	])

	const [investmentModeOptions, setInvestmentModeOptions] = useState<string[]>([
		'SIP',
		'Lump Sum',
		'Systematic Transfer',
		'Dividend Reinvestment',
	])

	const [investmentTypeOptions, setInvestmentTypeOptions] = useState<string[]>([
		'Mutual Fund',
		'Stocks',
		'Bonds',
		'ETF',
		'Fixed Deposit',
		'PPF',
		'Gold',
		'Real Estate',
		'Cryptocurrency',
	])

	const [newBankType, setNewBankType] = useState<string>('')
	const [newCardType, setNewCardType] = useState<string>('')
	const [newExpenseType, setNewExpenseType] = useState<string>('')
	const [newInvestmentMode, setNewInvestmentMode] = useState<string>('')
	const [newInvestmentType, setNewInvestmentType] = useState<string>('')

	const [expenses, setExpenses] = useState<Expense[]>([])
	const [investments, setInvestments] = useState<Investment[]>([])

	// Load option lists from Supabase (reload when user changes)
	useEffect(() => {
		// Reset to defaults immediately to avoid showing previous user's options
		setBankTypeOptions(['Checking','Savings','Credit Union','Digital Wallet'])
		setCardTypeOptions(['Debit','Credit','Prepaid','Virtual'])
		setExpenseTypeOptions(['Food','Transport','Bills','Entertainment','Shopping','Travel','Health','Other'])
		setInvestmentModeOptions(['SIP','Lump Sum','Systematic Transfer','Dividend Reinvestment'])
		setInvestmentTypeOptions(['Mutual Fund','Stocks','Bonds','ETF','Fixed Deposit','PPF','Gold','Real Estate','Cryptocurrency'])

		let isActive = true
		;(async () => {
			try {
				const keys = ['bankType', 'cardType', 'expenseType', 'investmentMode', 'investmentType'] as const
				const [bankRow, cardRow, expenseRow, investmentModeRow, investmentTypeRow] = await Promise.all(
					keys.map(key => supabaseDb.getOptionList(key))
				)
				if (!isActive) return
				
				// Update options from Supabase data
				if (bankRow?.items) {
					setBankTypeOptions(Array.from(new Set(bankRow.items)))
				}
				if (cardRow?.items) {
					setCardTypeOptions(Array.from(new Set(cardRow.items)))
				}
				if (expenseRow?.items) {
					setExpenseTypeOptions(Array.from(new Set(expenseRow.items)))
				}
				if (investmentModeRow?.items) {
					setInvestmentModeOptions(Array.from(new Set(investmentModeRow.items)))
				}
				if (investmentTypeRow?.items) {
					setInvestmentTypeOptions(Array.from(new Set(investmentTypeRow.items)))
				}
			} catch (error) {
				console.error('Error loading option lists:', error)
			}
		})()
		return () => {
			isActive = false
		}
	}, [user?.id, isAuthenticated])

	// Save option lists to Supabase when they change (but only if they're not empty and not just defaults)
	useEffect(() => {
		;(async () => {
			try {
				// Only save if options are not empty and not just the default values
				const defaultBankTypes = ['Checking', 'Savings', 'Credit Union', 'Digital Wallet']
				const defaultCardTypes = ['Debit', 'Credit', 'Prepaid', 'Virtual']
				const defaultExpenseTypes = ['Food', 'Transport', 'Bills', 'Entertainment', 'Shopping', 'Travel', 'Health', 'Other']
				const defaultInvestmentModes = ['SIP', 'Lump Sum', 'Systematic Transfer', 'Dividend Reinvestment']
				const defaultInvestmentTypes = ['Mutual Fund', 'Stocks', 'Bonds', 'ETF', 'Fixed Deposit', 'PPF', 'Gold', 'Real Estate', 'Cryptocurrency']
				
				if (bankTypeOptions.length > 0 && JSON.stringify(bankTypeOptions.sort()) !== JSON.stringify(defaultBankTypes.sort())) {
					await supabaseDb.upsertOptionList({ key: 'bankType', items: Array.from(new Set(bankTypeOptions)) })
				}
				if (cardTypeOptions.length > 0 && JSON.stringify(cardTypeOptions.sort()) !== JSON.stringify(defaultCardTypes.sort())) {
					await supabaseDb.upsertOptionList({ key: 'cardType', items: Array.from(new Set(cardTypeOptions)) })
				}
				if (expenseTypeOptions.length > 0 && JSON.stringify(expenseTypeOptions.sort()) !== JSON.stringify(defaultExpenseTypes.sort())) {
					await supabaseDb.upsertOptionList({ key: 'expenseType', items: Array.from(new Set(expenseTypeOptions)) })
				}
				if (investmentModeOptions.length > 0 && JSON.stringify(investmentModeOptions.sort()) !== JSON.stringify(defaultInvestmentModes.sort())) {
					await supabaseDb.upsertOptionList({ key: 'investmentMode', items: Array.from(new Set(investmentModeOptions)) })
				}
				if (investmentTypeOptions.length > 0 && JSON.stringify(investmentTypeOptions.sort()) !== JSON.stringify(defaultInvestmentTypes.sort())) {
					await supabaseDb.upsertOptionList({ key: 'investmentType', items: Array.from(new Set(investmentTypeOptions)) })
				}
			} catch (error) {
				console.error('Error saving option lists:', error)
			}
		})()
	}, [bankTypeOptions, cardTypeOptions, expenseTypeOptions, investmentModeOptions, investmentTypeOptions])

	// Table filters
	const [filterBankType, setFilterBankType] = useState<string>('')
	const [filterCardType, setFilterCardType] = useState<string>('')
	const [filterExpenseType, setFilterExpenseType] = useState<string>('')
	const [filterInvestmentMode, setFilterInvestmentMode] = useState<string>('')
	const [filterInvestmentType, setFilterInvestmentType] = useState<string>('')
	const [filterFromDate, setFilterFromDate] = useState<Dayjs | null>(null)
	const [filterToDate, setFilterToDate] = useState<Dayjs | null>(null)

	// Inline edit state
	const [editingIndex, setEditingIndex] = useState<number | null>(null)
	const [editDate, setEditDate] = useState<Dayjs | null>(null)
	const [editBankType, setEditBankType] = useState<string>('')
	const [editCardType, setEditCardType] = useState<string>('')
	const [editExpenseType, setEditExpenseType] = useState<string>('')
	const [editAmount, setEditAmount] = useState<string>('')
	const [editRemark, setEditRemark] = useState<string>('')
	const [editInvestmentMode, setEditInvestmentMode] = useState<string>('')
	const [editInvestmentType, setEditInvestmentType] = useState<string>('')
	const [editCurrentValue, setEditCurrentValue] = useState<string>('')
	const [editInvestmentAmount, setEditInvestmentAmount] = useState<string>('')

	// Load data based on mode (reload when user changes)
	useEffect(() => {
		let isActive = true
		;(async () => {
			try {
				if (mode === 'expenses') {
					const rows = await supabaseDb.getExpenses()
					if (!isActive) return
					setExpenses(rows)
				} else if (mode === 'investments') {
					const rows = await supabaseDb.getInvestments()
					if (!isActive) return
					setInvestments(rows)
				} else {
					// Total Assets mode - load both expenses and investments
					const [expenseRows, investmentRows] = await Promise.all([
						supabaseDb.getExpenses(),
						supabaseDb.getInvestments()
					])
					if (!isActive) return
					setExpenses(expenseRows)
					setInvestments(investmentRows)
				}
			} catch (error) {
				console.error(`Error loading ${mode}:`, error)
			}
		})()
		return () => {
			isActive = false
		}
	}, [mode, user?.id, isAuthenticated])

	function startEdit(idx: number) {
		if (mode === 'expenses') {
			const e = filteredExpenses[idx]
			setEditingIndex(idx)
			setEditDate(e.date ? dayjs(e.date) : null)
			setEditBankType(e.bank_type)
			setEditCardType(e.card_type)
			setEditExpenseType(e.expense_type)
			setEditAmount(String(e.amount))
			setEditRemark(e.remark)
		} else {
			const i = filteredInvestments[idx]
			setEditingIndex(idx)
			setEditDate(i.date ? dayjs(i.date) : null)
			setEditInvestmentMode(i.investment_mode)
			setEditInvestmentType(i.investment_type)
			setEditCurrentValue(String(i.current_value))
			setEditInvestmentAmount(String(i.investment_amount))
		}
	}

	function cancelEdit() {
		setEditingIndex(null)
	}

	async function saveEdit() {
		if (editingIndex === null) return
		
		if (mode === 'expenses') {
			const amt = parseFloat(editAmount)
			if (!Number.isFinite(amt)) return
			const updated: Expense = {
				date: editDate ? editDate.format('YYYY-MM-DD') : '',
				amount: amt,
				remark: editRemark,
				bank_type: editBankType,
				card_type: editCardType,
				expense_type: editExpenseType,
			}
			setExpenses((prev) => {
				const copy = [...prev]
				const originalIndex = prev.findIndex((p) => p === filteredExpenses[editingIndex])
				if (originalIndex !== -1) {
					const existingId = copy[originalIndex]?.id
					copy[originalIndex] = { ...updated, id: existingId }
					if (existingId !== undefined) {
						void supabaseDb.updateExpense(existingId, updated)
					}
				}
				return copy
			})
		} else {
			const currentVal = parseFloat(editCurrentValue)
			const investAmt = parseFloat(editInvestmentAmount)
			if (!Number.isFinite(currentVal) || !Number.isFinite(investAmt)) return
			const returnValue = currentVal - investAmt
			const updated: Investment = {
				date: editDate ? editDate.format('YYYY-MM-DD') : '',
				investment_mode: editInvestmentMode,
				investment_type: editInvestmentType,
				current_value: currentVal,
				investment_amount: investAmt,
				return_value: returnValue,
			}
			setInvestments((prev) => {
				const copy = [...prev]
				const originalIndex = prev.findIndex((p) => p === filteredInvestments[editingIndex])
				if (originalIndex !== -1) {
					const existingId = copy[originalIndex]?.id
					copy[originalIndex] = { ...updated, id: existingId }
					if (existingId !== undefined) {
						void supabaseDb.updateInvestment(existingId, updated)
					}
				}
				return copy
			})
		}
		setEditingIndex(null)
	}

	function addIfNotExists(list: string[], value: string): string[] {
		const exists = list.some((o) => o.toLowerCase() === value.toLowerCase())
		return exists ? list : [...list, value]
	}

	async function persistList(key: string, items: string[]) {
		await supabaseDb.upsertOptionList({ key, items })
	}

	async function handleAddExpense() {
		const amt = parseFloat(amount)
		if (!Number.isFinite(amt)) return
		
		// Check if an entry with same bank_type, card_type, and expense_type exists for today
		const today = date ? date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
		const existingEntry = expenses.find(e => 
			e.date === today && 
			e.bank_type === bankType && 
			e.card_type === cardType && 
			e.expense_type === expenseType
		)
		
		if (existingEntry) {
			// Update existing entry by adding the new amount
			const newAmount = existingEntry.amount + amt
			const newRemark = existingEntry.remark 
				? `${existingEntry.remark}, ${amt.toFixed(2)}`
				: `${amt.toFixed(2)}`
			
			const updated: Expense = {
				...existingEntry,
				amount: newAmount,
				remark: newRemark,
			}
			
			// Update in database
			if (existingEntry.id) {
				await supabaseDb.updateExpense(existingEntry.id, updated)
			}
			
			// Update in local state
			setExpenses((prev) => 
				prev.map(e => e.id === existingEntry.id ? updated : e)
			)
		} else {
			// Create new entry
			const entry: Omit<Expense, 'id' | 'created_at' | 'updated_at'> = {
				date: today,
				amount: amt,
				remark,
				bank_type: bankType,
				card_type: cardType,
				expense_type: expenseType,
			}
			const id = await supabaseDb.addExpense(entry)
			const saved: Expense = { ...entry, id }
			setExpenses((prev) => [saved, ...prev])
		}
		
		setAmount('')
		setRemark('')
	}

	async function handleAddInvestment() {
		const currentVal = parseFloat(currentValue)
		const investAmt = parseFloat(investmentAmount)
		if (!Number.isFinite(currentVal) || !Number.isFinite(investAmt)) return
		const returnValue = currentVal - investAmt
		const entry: Omit<Investment, 'id' | 'created_at' | 'updated_at'> = {
			date: date ? date.format('YYYY-MM-DD') : '',
			investment_mode: investmentMode,
			investment_type: investmentType,
			current_value: currentVal,
			investment_amount: investAmt,
			return_value: returnValue,
		}
		const id = await supabaseDb.addInvestment(entry)
		const saved: Investment = { ...entry, id }
		setInvestments((prev) => [saved, ...prev])
		setCurrentValue('')
		setInvestmentAmount('')
	}

	const isAddExpenseDisabled = !date || !bankType || !cardType || !expenseType || !remark.trim() || !amount || !Number.isFinite(Number.parseFloat(amount))
	const isAddInvestmentDisabled = !date || !investmentMode || !investmentType || !currentValue || !investmentAmount || !Number.isFinite(Number.parseFloat(currentValue)) || !Number.isFinite(Number.parseFloat(investmentAmount))

	const filteredExpenses = expenses.filter((e) => {
		if (showAll) {
			const d = e.date ? dayjs(e.date) : null
			if (filterFromDate && d && d.isBefore(filterFromDate, 'day')) return false
			if (filterToDate && d && d.isAfter(filterToDate, 'day')) return false
		}
		if (filterBankType && e.bank_type !== filterBankType) return false
		if (filterCardType && e.card_type !== filterCardType) return false
		if (filterExpenseType && e.expense_type !== filterExpenseType) return false
		return true
	}).sort((a, b) => {
		// Sort by date in descending order (latest first)
		const dateA = a.date ? new Date(a.date).getTime() : 0
		const dateB = b.date ? new Date(b.date).getTime() : 0
		return dateB - dateA
	})

	const filteredInvestments = investments.filter((i) => {
		if (showAll) {
			const d = i.date ? dayjs(i.date) : null
			if (filterFromDate && d && d.isBefore(filterFromDate, 'day')) return false
			if (filterToDate && d && d.isAfter(filterToDate, 'day')) return false
		}
		if (filterInvestmentMode && i.investment_mode !== filterInvestmentMode) return false
		if (filterInvestmentType && i.investment_type !== filterInvestmentType) return false
		return true
	}).sort((a, b) => {
		// Sort by date in descending order (latest first)
		const dateA = a.date ? new Date(a.date).getTime() : 0
		const dateB = b.date ? new Date(b.date).getTime() : 0
		return dateB - dateA
	})

	// Calculate totals based on cutoff date for Total Assets
	const cutoffDateStr = totalAssetsCutoffDate ? totalAssetsCutoffDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
	
	// Filter expenses up to cutoff date
	const expensesUpToCutoff = filteredExpenses.filter(e => e.date <= cutoffDateStr)
	const totalExpenseAmount = expensesUpToCutoff.reduce((sum, e) => sum + e.amount, 0)
	
	// Calculate investment totals using latest values for each unique investment combination up to cutoff date
	const investmentsUpToCutoff = filteredInvestments.filter(i => i.date <= cutoffDateStr)
	const investmentGroups = investmentsUpToCutoff.reduce((groups, investment) => {
		const key = `${investment.investment_mode}-${investment.investment_type}`
		if (!groups[key] || new Date(investment.date) > new Date(groups[key].date)) {
			groups[key] = investment
		}
		return groups
	}, {} as Record<string, Investment>)
	
	const latestInvestments = Object.values(investmentGroups)
	const totalInvestmentAmount = latestInvestments.reduce((sum, i) => sum + i.investment_amount, 0)
	const totalCurrentValue = latestInvestments.reduce((sum, i) => sum + i.current_value, 0)
	const totalReturnValue = latestInvestments.reduce((sum, i) => sum + i.return_value, 0)

	// Create a Set of IDs for investments that are used in calculations (latest for each unique combination)
	const latestInvestmentIds = new Set(latestInvestments.map(i => i.id).filter(id => id !== undefined))
	
	// Function to check if an investment is used for calculation
	const isInvestmentUsedForCalculation = (investment: Investment): boolean => {
		return latestInvestmentIds.has(investment.id)
	}
	
	const formatINR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

	const isEditExpenseValid = editingIndex !== null && mode === 'expenses' && editDate && editBankType && editCardType && editExpenseType && editRemark.trim() && editAmount && Number.isFinite(Number.parseFloat(editAmount))
	const isEditInvestmentValid = editingIndex !== null && mode === 'investments' && editDate && editInvestmentMode && editInvestmentType && editCurrentValue && editInvestmentAmount && Number.isFinite(Number.parseFloat(editCurrentValue)) && Number.isFinite(Number.parseFloat(editInvestmentAmount))

	// Check if any filters are applied
	const hasExpenseFilters = filterBankType || filterCardType || filterExpenseType || filterFromDate || filterToDate
	const hasInvestmentFilters = filterInvestmentMode || filterInvestmentType || filterFromDate || filterToDate

	// Reset all filters function
	const resetFilters = () => {
		setFilterBankType('')
		setFilterCardType('')
		setFilterExpenseType('')
		setFilterInvestmentMode('')
		setFilterInvestmentType('')
		setFilterFromDate(null)
		setFilterToDate(null)
	}

	// Delete expense function
	async function deleteExpense(expenseId: number) {
		try {
			await supabaseDb.deleteExpense(expenseId)
			setExpenses((prev) => prev.filter((e) => e.id !== expenseId))
		} catch (error) {
			console.error('Error deleting expense:', error)
		}
	}

	// Delete investment function
	async function deleteInvestment(investmentId: number) {
		try {
			await supabaseDb.deleteInvestment(investmentId)
			setInvestments((prev) => prev.filter((i) => i.id !== investmentId))
		} catch (error) {
			console.error('Error deleting investment:', error)
		}
	}

	return (
		<ProtectedRoute>
			<AppHeader />
			<div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"' }}>
				{/* Supabase Configuration Warning */}
				{!isSupabaseConfigured && (
					<Paper elevation={2} sx={{ p: 3, mb: 3, backgroundColor: 'warning.light', border: '1px solid', borderColor: 'warning.main' }}>
						<Typography variant="h6" sx={{ color: 'warning.dark', mb: 1, fontWeight: 'bold' }}>
							⚠️ Supabase Not Configured
						</Typography>
						<Typography variant="body2" sx={{ color: 'warning.dark', mb: 2 }}>
							Your application is running in offline mode. To enable data persistence, please:
						</Typography>
						<Box component="ol" sx={{ pl: 2, mb: 2 }}>
							<Typography component="li" variant="body2" sx={{ color: 'warning.dark', mb: 1 }}>
								Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>supabase.com</a>
							</Typography>
							<Typography component="li" variant="body2" sx={{ color: 'warning.dark', mb: 1 }}>
								Create a <code>.env</code> file in your project root with:
								<Box component="pre" sx={{ mt: 1, p: 1, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 1, fontSize: '0.8rem' }}>
									VITE_SUPABASE_URL=your_supabase_project_url<br/>
									VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
								</Box>
							</Typography>
							<Typography component="li" variant="body2" sx={{ color: 'warning.dark', mb: 1 }}>
								Run the SQL scripts from <code>database_setup.sql</code> in your Supabase SQL Editor
							</Typography>
							<Typography component="li" variant="body2" sx={{ color: 'warning.dark' }}>
								Restart your development server
							</Typography>
						</Box>
						<Typography variant="body2" sx={{ color: 'warning.dark', fontStyle: 'italic' }}>
							Note: Data entered in offline mode will not be saved permanently.
						</Typography>
					</Paper>
				)}
				
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
					<Typography variant="h4" sx={{ fontWeight: 700 }}>Finance Dashboard</Typography>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
					<ToggleButtonGroup
						value={mode}
						exclusive
						onChange={(_, newMode) => {
							if (newMode !== null) {
								setMode(newMode)
								setEditingIndex(null) // Reset editing when switching modes
							}
						}}
						size="small"
					>
						<ToggleButton value="expenses">Expenses</ToggleButton>
						<ToggleButton value="investments">Investments</ToggleButton>
						<ToggleButton value="totalAssets">Total Assets</ToggleButton>
					</ToggleButtonGroup>
					<FormControlLabel
						label={showAll ? 
							(mode === 'expenses' ? 'All Expenses' : 
							 mode === 'investments' ? 'All Investments' : 
							 'All Data') : 
							`Today's Entry`}
						control={<Switch checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />}
						sx={{ 
							minWidth: '120px',
							'& .MuiFormControlLabel-label': {
								width: '100px',
								textAlign: 'left'
							}
						}}
					/>
				</Box>
			</Box>
			<Typography variant="body1" sx={{ color: 'text.secondary', mb: 1.5 }}>
				{mode === 'expenses' ? 
					(showAll ? 
						(expenseViewMode === 'table' ? 'Track your Expenses - Table View' : 'Track your Expenses - Charts View') :
						'Track your Expenses') :
				 mode === 'investments' ? 
					(showAll ? 
						(investmentViewMode === 'table' ? 'Track your Regular Investments - Table View' : 'Track your Regular Investments - Charts View') :
						'Track your Regular Investments') :
				 'View your complete financial overview'}
			</Typography>
			<LocalizationProvider dateAdapter={AdapterDayjs}>
				{!showAll && (mode === 'expenses' || mode === 'investments') && (
					<Paper elevation={1} sx={{ p: 2.5, mb: 2, borderRadius: 2, background: 'linear-gradient(180deg, #ffffff, #f4f7ff)' }}>
						{mode === 'expenses' ? (
							<form onSubmit={(e) => { e.preventDefault(); if (!isAddExpenseDisabled) handleAddExpense() }}>
								<Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 2, alignItems: 'center' }}>
									<DatePicker
										label="Date"
										value={date}
										onChange={(v) => setDate(v)}
										slotProps={{ textField: { size: 'small' } }}
									/>

									<Box sx={{ minWidth: 170, width: 200 }}>
										<AddableSelect
											label="Bank Type"
											value={bankType}
											options={bankTypeOptions}
											onChange={setBankType}
											onAddOption={(v) => setBankTypeOptions((prev) => addIfNotExists(prev, v))}
											onDeleteOption={(v) => {
												setBankTypeOptions((prev) => prev.filter((o) => o !== v))
												if (bankType === v) setBankType('')
											}}
											newValue={newBankType}
											setNewValue={setNewBankType}
											placeholder="Enter new bank type"
										/>
									</Box>

									<Box sx={{ minWidth: 170, width: 200 }}>
										<AddableSelect
											label="Card Type"
											value={cardType}
											options={cardTypeOptions}
											onChange={setCardType}
											onAddOption={(v) => setCardTypeOptions((prev) => addIfNotExists(prev, v))}
											onDeleteOption={(v) => {
												setCardTypeOptions((prev) => prev.filter((o) => o !== v))
												if (cardType === v) setCardType('')
											}}
											newValue={newCardType}
											setNewValue={setNewCardType}
											placeholder="Enter new card type"
										/>
									</Box>

									<Box sx={{ minWidth: 170, width: 200 }}>
										<AddableSelect
											label="Expense Type"
											value={expenseType}
											options={expenseTypeOptions}
											onChange={setExpenseType}
											onAddOption={(v) => setExpenseTypeOptions((prev) => addIfNotExists(prev, v))}
											onDeleteOption={(v) => {
												setExpenseTypeOptions((prev) => prev.filter((o) => o !== v))
												if (expenseType === v) setExpenseType('')
											}}
											newValue={newExpenseType}
											setNewValue={setNewExpenseType}
											placeholder="Enter new expense type"
										/>
									</Box>

									<TextField
										size="small"
										label="Amount spent"
										type="number"
										inputProps={{ step: '0.01' }}
										placeholder="0.00"
										value={amount}
										onChange={(e) => setAmount(e.target.value)}
										sx={{ minWidth: 120, width: 140 }}
									/>

									<TextField
										size="small"
										label="Remark"
										placeholder="e.g., Coffee, transport..."
										value={remark}
										onChange={(e) => setRemark(e.target.value)}
										sx={{ minWidth: 200, width: 260 }}
									/>

									<Button type="submit" variant="contained" disabled={isAddExpenseDisabled} startIcon={<AddRoundedIcon />} sx={{ whiteSpace: 'nowrap' }}>
										Add
									</Button>
								</Box>
							</form>
						) : (
							<form onSubmit={(e) => { e.preventDefault(); if (!isAddInvestmentDisabled) handleAddInvestment() }}>
								<Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 2, alignItems: 'center' }}>
									<DatePicker
										label="Date"
										value={date}
										onChange={(v) => setDate(v)}
										slotProps={{ textField: { size: 'small' } }}
									/>

									<Box sx={{ minWidth: 170, width: 200 }}>
										<AddableSelect
											label="Investment Mode"
											value={investmentMode}
											options={investmentModeOptions}
											onChange={setInvestmentMode}
											onAddOption={(v) => setInvestmentModeOptions((prev) => addIfNotExists(prev, v))}
											onDeleteOption={(v) => {
												setInvestmentModeOptions((prev) => prev.filter((o) => o !== v))
												if (investmentMode === v) setInvestmentMode('')
											}}
											newValue={newInvestmentMode}
											setNewValue={setNewInvestmentMode}
											placeholder="Enter new investment mode"
										/>
									</Box>

									<Box sx={{ minWidth: 170, width: 200 }}>
										<AddableSelect
											label="Investment Type"
											value={investmentType}
											options={investmentTypeOptions}
											onChange={setInvestmentType}
											onAddOption={(v) => setInvestmentTypeOptions((prev) => addIfNotExists(prev, v))}
											onDeleteOption={(v) => {
												setInvestmentTypeOptions((prev) => prev.filter((o) => o !== v))
												if (investmentType === v) setInvestmentType('')
											}}
											newValue={newInvestmentType}
											setNewValue={setNewInvestmentType}
											placeholder="Enter new investment type"
										/>
									</Box>

									<TextField
										size="small"
										label="Current Value"
										type="number"
										inputProps={{ step: '0.01' }}
										placeholder="0.00"
										value={currentValue}
										onChange={(e) => setCurrentValue(e.target.value)}
										sx={{ minWidth: 120, width: 140 }}
									/>

									<TextField
										size="small"
										label="Investment Amount"
										type="number"
										inputProps={{ step: '0.01' }}
										placeholder="0.00"
										value={investmentAmount}
										onChange={(e) => setInvestmentAmount(e.target.value)}
										sx={{ minWidth: 120, width: 140 }}
									/>

									<Button type="submit" variant="contained" disabled={isAddInvestmentDisabled} startIcon={<AddRoundedIcon />} sx={{ whiteSpace: 'nowrap' }}>
										Add
									</Button>
								</Box>
							</form>
						)}
					</Paper>
				)}

				{mode === 'totalAssets' && (
					<Box sx={{ marginTop: 2 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
							<Typography variant="h6">Financial Overview</Typography>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
								<Typography variant="body2" sx={{ color: 'text.secondary' }}>
									As of:
								</Typography>
								<DatePicker
									label="Cutoff Date"
									value={totalAssetsCutoffDate}
									onChange={(v) => setTotalAssetsCutoffDate(v)}
									slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
								/>
							</Box>
						</Box>
						<Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontStyle: 'italic' }}>
							* Investment values shown are the latest entries for each unique investment combination up to the selected date
						</Typography>
						<Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<Box sx={{ width: 16, height: 16, backgroundColor: 'rgba(76, 175, 80, 0.2)', border: '2px solid #4caf50', borderRadius: 1 }} />
								<Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
									Used for calculation (latest value)
								</Typography>
							</Box>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<Box sx={{ width: 16, height: 16, backgroundColor: 'rgba(255, 107, 107, 0.2)', border: '2px solid #ff6b6b', borderRadius: 1 }} />
								<Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
									Expense entries
								</Typography>
							</Box>
						</Box>
						<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
							<Paper elevation={1} sx={{ p: 2, borderRadius: 2, background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)' }}>
								<Typography variant="h6" sx={{ color: 'white', mb: 1 }}>Total Expenses</Typography>
								<Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
									{formatINR.format(totalExpenseAmount)}
								</Typography>
								<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
									{expensesUpToCutoff.length} transactions
								</Typography>
							</Paper>
							<Paper elevation={1} sx={{ p: 2, borderRadius: 2, background: 'linear-gradient(135deg, #4ecdc4, #44a08d)' }}>
								<Typography variant="h6" sx={{ color: 'white', mb: 1 }}>Total Invested</Typography>
								<Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
									{formatINR.format(totalInvestmentAmount)}
								</Typography>
								<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
									{latestInvestments.length} unique investments
								</Typography>
							</Paper>
							<Paper elevation={1} sx={{ p: 2, borderRadius: 2, background: 'linear-gradient(135deg, #45b7d1, #96c93d)' }}>
								<Typography variant="h6" sx={{ color: 'white', mb: 1 }}>Current Value</Typography>
								<Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
									{formatINR.format(totalCurrentValue)}
								</Typography>
								<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
									Portfolio value
								</Typography>
							</Paper>
							<Paper elevation={1} sx={{ p: 2, borderRadius: 2, background: totalReturnValue >= 0 ? 'linear-gradient(135deg, #56ab2f, #a8e6cf)' : 'linear-gradient(135deg, #cb2d3e, #ef473a)' }}>
								<Typography variant="h6" sx={{ color: 'white', mb: 1 }}>Total Returns</Typography>
								<Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
									{formatINR.format(totalReturnValue)}
								</Typography>
								<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
									{totalReturnValue >= 0 ? 'Profit' : 'Loss'}
								</Typography>
							</Paper>
						</Box>
						<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2, mb: 3 }}>
							<Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
								<Typography variant="h6" sx={{ mb: 2 }}>Net Worth</Typography>
								<Typography variant="h3" sx={{ fontWeight: 'bold', color: totalCurrentValue - totalExpenseAmount >= 0 ? 'success.main' : 'error.main' }}>
									{formatINR.format(totalCurrentValue - totalExpenseAmount)}
								</Typography>
								<Typography variant="body2" sx={{ color: 'text.secondary' }}>
									Current Value - Total Expenses
								</Typography>
							</Paper>
							<Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
								<Typography variant="h6" sx={{ mb: 2 }}>Investment Performance</Typography>
								<Typography variant="h3" sx={{ fontWeight: 'bold', color: totalInvestmentAmount > 0 ? (totalReturnValue / totalInvestmentAmount * 100 >= 0 ? 'success.main' : 'error.main') : 'text.primary' }}>
									{totalInvestmentAmount > 0 ? `${(totalReturnValue / totalInvestmentAmount * 100).toFixed(2)}%` : '0%'}
								</Typography>
								<Typography variant="body2" sx={{ color: 'text.secondary' }}>
									Return on Investment
								</Typography>
							</Paper>
						</Box>
					</Box>
				)}

				{/* Investment Today's Entry - Simple view without totals */}
				{mode === 'investments' && !showAll && investments.length > 0 && (
					<Box sx={{ marginTop: 2 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
							<Typography variant="h6">Today's Entry</Typography>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<Box sx={{ width: 12, height: 12, backgroundColor: 'rgba(76, 175, 80, 0.2)', border: '2px solid #4caf50', borderRadius: 1 }} />
								<Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
									Latest value used for totals
								</Typography>
							</Box>
						</Box>
						<TableContainer component={Paper} sx={{ backgroundColor: 'rgba(0,0,0,0.03)', border: '1px solid', borderColor: 'divider', borderRadius: 2, boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }}>
							<Table size="small">
								<TableHead>
									<TableRow sx={{ backgroundColor: 'primary.main' }}>
										<TableCell sx={{ color: 'primary.contrastText' }}>Date</TableCell>
										<TableCell sx={{ color: 'primary.contrastText' }}>Investment Mode</TableCell>
										<TableCell sx={{ color: 'primary.contrastText' }}>Investment Type</TableCell>
										<TableCell align="right" sx={{ color: 'primary.contrastText' }}>Current Value</TableCell>
										<TableCell align="right" sx={{ color: 'primary.contrastText' }}>Investment Amount</TableCell>
										<TableCell align="right" sx={{ color: 'primary.contrastText' }}>Return</TableCell>
										<TableCell sx={{ color: 'primary.contrastText' }}>Actions</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{filteredInvestments.map((i, idx) => {
											const isEditing = editingIndex === idx
											const hasNegativeValue = i.current_value < 0 || i.investment_amount < 0
											const isUsedForCalculation = isInvestmentUsedForCalculation(i)
											return (
												<TableRow 
													key={idx} 
													hover
													sx={{
														backgroundColor: hasNegativeValue 
															? 'rgba(255, 0, 0, 0.15)' 
															: isUsedForCalculation 
																? 'rgba(76, 175, 80, 0.2)' // Light green for calculation rows
																: 'inherit',
														borderLeft: isUsedForCalculation ? '4px solid #4caf50' : 'none'
													}}
												>
													<TableCell>
														{isEditing ? (
															<DatePicker
																label={undefined}
																value={editDate}
																onChange={(v) => setEditDate(v)}
																slotProps={{ textField: { size: 'small' } }}
															/>
														) : (
															<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
																<span>{i.date || '—'}</span>
																{isUsedForCalculation && (
																	<span 
																		style={{ 
																			fontSize: '0.7rem', 
																			color: '#4caf50', 
																			fontWeight: 'bold',
																			backgroundColor: 'rgba(76, 175, 80, 0.1)',
																			padding: '2px 6px',
																			borderRadius: '4px'
																		}}
																	>
																		✓ Used
																	</span>
																)}
															</Box>
														)}
													</TableCell>
													<TableCell>
														{isEditing ? (
															<FormControl fullWidth size="small">
																<Select value={editInvestmentMode} onChange={(ev) => setEditInvestmentMode(ev.target.value as string)}>
																	{investmentModeOptions.map((opt) => (
																		<MenuItem key={opt} value={opt}>{opt}</MenuItem>
																	))}
																</Select>
															</FormControl>
														) : (
															<span>{i.investment_mode || '—'}</span>
														)}
													</TableCell>
													<TableCell>
														{isEditing ? (
															<FormControl fullWidth size="small">
																<Select value={editInvestmentType} onChange={(ev) => setEditInvestmentType(ev.target.value as string)}>
																	{investmentTypeOptions.map((opt) => (
																		<MenuItem key={opt} value={opt}>{opt}</MenuItem>
																	))}
																</Select>
															</FormControl>
														) : (
															<span>{i.investment_type || '—'}</span>
														)}
													</TableCell>
													<TableCell align="right">
														{isEditing ? (
															<TextField
																size="small"
																type="number"
																inputProps={{ step: '0.01' }}
																value={editCurrentValue}
																onChange={(ev) => setEditCurrentValue(ev.target.value)}
															/>
														) : (
															<span>{formatINR.format(i.current_value)}</span>
														)}
													</TableCell>
													<TableCell align="right">
														{isEditing ? (
															<TextField
																size="small"
																type="number"
																inputProps={{ step: '0.01' }}
																value={editInvestmentAmount}
																onChange={(ev) => setEditInvestmentAmount(ev.target.value)}
															/>
														) : (
															<span>{formatINR.format(i.investment_amount)}</span>
														)}
													</TableCell>
													<TableCell align="right">
														<span style={{ color: i.return_value >= 0 ? 'green' : 'red' }}>
															{formatINR.format(i.return_value)}
														</span>
													</TableCell>
													<TableCell>
														{isEditing ? (
															<Box sx={{ display: 'flex', gap: 1 }}>
																<IconButton color="success" size="small" disabled={!isEditInvestmentValid} onClick={saveEdit} aria-label="Save">
																	<CheckRoundedIcon />
																</IconButton>
																<IconButton color="inherit" size="small" onClick={cancelEdit} aria-label="Cancel">
																	<CloseRoundedIcon />
																</IconButton>
															</Box>
														) : (
															<Box sx={{ display: 'flex', gap: 1 }}>
																<IconButton size="small" onClick={() => startEdit(idx)} aria-label="Edit">
																	<EditRoundedIcon />
																</IconButton>
																<IconButton 
																	size="small" 
																	onClick={() => i.id && deleteInvestment(i.id)} 
																	aria-label="Delete"
																	sx={{ color: 'error.main' }}
																>
																	<DeleteRoundedIcon />
																</IconButton>
															</Box>
														)}
													</TableCell>
												</TableRow>
											)
										})}
								</TableBody>
							</Table>
						</TableContainer>
					</Box>
				)}

				{/* View Toggle Buttons - Show only when in All mode */}
				{showAll && ((mode === 'expenses' && expenses.length > 0) || (mode === 'investments' && investments.length > 0)) && (
					<Box sx={{ mt: 2, mb: 2, display: 'flex', justifyContent: 'center' }}>
						<ToggleButtonGroup
							value={mode === 'expenses' ? expenseViewMode : investmentViewMode}
							exclusive
							onChange={(_, newViewMode) => {
								if (newViewMode !== null) {
									if (mode === 'expenses') {
										setExpenseViewMode(newViewMode)
									} else {
										setInvestmentViewMode(newViewMode)
									}
								}
							}}
							size="small"
							sx={{ 
								backgroundColor: 'rgba(0, 0, 0, 0.04)',
								borderRadius: 2,
								'& .MuiToggleButton-root': {
									border: 'none',
									borderRadius: 2,
									mx: 0.5,
									'&.Mui-selected': {
										backgroundColor: 'primary.main',
										color: 'primary.contrastText',
										'&:hover': {
											backgroundColor: 'primary.dark',
										}
									}
								}
							}}
						>
							<ToggleButton value="table">📊 Table View</ToggleButton>
							<ToggleButton value="charts">📈 Charts View</ToggleButton>
						</ToggleButtonGroup>
					</Box>
				)}

				{((mode === 'expenses' && expenses.length > 0 && expenseViewMode === 'table') || (mode === 'investments' && investments.length > 0 && investmentViewMode === 'table') || (mode === 'totalAssets' && (expenses.length > 0 || investments.length > 0))) && (showAll || mode !== 'investments') && (mode !== 'totalAssets' || showAll) && (
					<Box sx={{ marginTop: 2 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
							<Typography variant="h6">
								{showAll ? 
									(mode === 'expenses' ? 'All Expenses' : 
									 mode === 'investments' ? 'All Investments' : 
									 'All Transactions') : 
									`Today's Entry`}
							</Typography>
							{mode === 'investments' && (
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									<Box sx={{ width: 12, height: 12, backgroundColor: 'rgba(76, 175, 80, 0.2)', border: '2px solid #4caf50', borderRadius: 1 }} />
									<Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
										Latest value used for totals
									</Typography>
								</Box>
							)}
						</Box>
						<TableContainer component={Paper} sx={{ backgroundColor: 'rgba(0,0,0,0.03)', border: '1px solid', borderColor: 'divider', borderRadius: 2, boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }}>
							<Table size="small">
								<TableHead>
									<TableRow sx={{ backgroundColor: 'primary.main' }}>
										<TableCell sx={{ color: 'primary.contrastText' }}>Date</TableCell>
										{mode === 'expenses' ? (
											<>
												<TableCell sx={{ color: 'primary.contrastText' }}>Bank Type</TableCell>
												<TableCell sx={{ color: 'primary.contrastText' }}>Card Type</TableCell>
												<TableCell sx={{ color: 'primary.contrastText' }}>Expense Type</TableCell>
												<TableCell align="right" sx={{ color: 'primary.contrastText' }}>Amount</TableCell>
												<TableCell sx={{ color: 'primary.contrastText' }}>Remark</TableCell>
											</>
										) : mode === 'investments' ? (
											<>
												<TableCell sx={{ color: 'primary.contrastText' }}>Investment Mode</TableCell>
												<TableCell sx={{ color: 'primary.contrastText' }}>Investment Type</TableCell>
												<TableCell align="right" sx={{ color: 'primary.contrastText' }}>Current Value</TableCell>
												<TableCell align="right" sx={{ color: 'primary.contrastText' }}>Investment Amount</TableCell>
												<TableCell align="right" sx={{ color: 'primary.contrastText' }}>Return</TableCell>
											</>
										) : (
											<>
												<TableCell sx={{ color: 'primary.contrastText' }}>Type</TableCell>
												<TableCell sx={{ color: 'primary.contrastText' }}>Category</TableCell>
												<TableCell sx={{ color: 'primary.contrastText' }}>Subcategory</TableCell>
												<TableCell align="right" sx={{ color: 'primary.contrastText' }}>Amount</TableCell>
												<TableCell sx={{ color: 'primary.contrastText' }}>Details</TableCell>
											</>
										)}
										<TableCell sx={{ color: 'primary.contrastText' }}>Actions</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>
											{showAll && (
												<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
													<DatePicker
														label="From"
														value={filterFromDate}
														onChange={(v) => setFilterFromDate(v)}
														slotProps={{ textField: { size: 'small' } }}
													/>
													<DatePicker
														label="To"
														value={filterToDate}
														onChange={(v) => setFilterToDate(v)}
														slotProps={{ textField: { size: 'small' } }}
													/>
													{((mode === 'expenses' && hasExpenseFilters) || (mode === 'investments' && hasInvestmentFilters)) && (
														<Button
															variant="outlined"
															size="small"
															onClick={resetFilters}
															sx={{ 
																ml: 2,
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
											)}
										</TableCell>
										{mode === 'expenses' ? (
											<>
												<TableCell>
													<FormControl fullWidth size="small">
														<Select
															displayEmpty
															value={filterBankType}
															onChange={(e) => setFilterBankType(e.target.value as string)}
															renderValue={(selected) => (selected ? (selected as string) : 'All')}
														>
															<MenuItem value="">
																All
															</MenuItem>
															{bankTypeOptions.map((opt) => (
																<MenuItem key={opt} value={opt}>
																	{opt}
																</MenuItem>
															))}
														</Select>
													</FormControl>
												</TableCell>
												<TableCell>
													<FormControl fullWidth size="small">
														<Select
															displayEmpty
															value={filterCardType}
															onChange={(e) => setFilterCardType(e.target.value as string)}
															renderValue={(selected) => (selected ? (selected as string) : 'All')}
														>
															<MenuItem value="">
																All
															</MenuItem>
															{cardTypeOptions.map((opt) => (
																<MenuItem key={opt} value={opt}>
																	{opt}
																</MenuItem>
															))}
														</Select>
													</FormControl>
												</TableCell>
												<TableCell>
													<FormControl fullWidth size="small">
														<Select
															displayEmpty
															value={filterExpenseType}
															onChange={(e) => setFilterExpenseType(e.target.value as string)}
															renderValue={(selected) => (selected ? (selected as string) : 'All')}
														>
															<MenuItem value="">
																All
															</MenuItem>
															{expenseTypeOptions.map((opt) => (
																<MenuItem key={opt} value={opt}>
																	{opt}
																</MenuItem>
															))}
														</Select>
													</FormControl>
												</TableCell>
												<TableCell />
												<TableCell />
											</>
										) : mode === 'investments' ? (
											<>
												<TableCell>
													<FormControl fullWidth size="small">
														<Select
															displayEmpty
															value={filterInvestmentMode}
															onChange={(e) => setFilterInvestmentMode(e.target.value as string)}
															renderValue={(selected) => (selected ? (selected as string) : 'All')}
														>
															<MenuItem value="">
																All
															</MenuItem>
															{investmentModeOptions.map((opt) => (
																<MenuItem key={opt} value={opt}>
																	{opt}
																</MenuItem>
															))}
														</Select>
													</FormControl>
												</TableCell>
												<TableCell>
													<FormControl fullWidth size="small">
														<Select
															displayEmpty
															value={filterInvestmentType}
															onChange={(e) => setFilterInvestmentType(e.target.value as string)}
															renderValue={(selected) => (selected ? (selected as string) : 'All')}
														>
															<MenuItem value="">
																All
															</MenuItem>
															{investmentTypeOptions.map((opt) => (
																<MenuItem key={opt} value={opt}>
																	{opt}
																</MenuItem>
															))}
														</Select>
													</FormControl>
												</TableCell>
												<TableCell />
												<TableCell />
												<TableCell />
											</>
										) : (
											<>
												<TableCell>
													<FormControl fullWidth size="small">
														<Select
															displayEmpty
															value=""
															renderValue={(selected) => 'All'}
														>
															<MenuItem value="">
																All
															</MenuItem>
														</Select>
													</FormControl>
												</TableCell>
												<TableCell>
													<FormControl fullWidth size="small">
														<Select
															displayEmpty
															value=""
															renderValue={(selected) => 'All'}
														>
															<MenuItem value="">
																All
															</MenuItem>
														</Select>
													</FormControl>
												</TableCell>
												<TableCell>
													<FormControl fullWidth size="small">
														<Select
															displayEmpty
															value=""
															renderValue={(selected) => 'All'}
														>
															<MenuItem value="">
																All
															</MenuItem>
														</Select>
													</FormControl>
												</TableCell>
												<TableCell />
												<TableCell />
											</>
										)}
										<TableCell />
									</TableRow>
								</TableHead>
								<TableBody>
									{mode === 'expenses' ? (
										filteredExpenses.map((e, idx) => {
											const isEditing = editingIndex === idx
											const hasNegativeAmount = e.amount < 0
											return (
												<TableRow 
													key={idx} 
													hover
													sx={{
														backgroundColor: hasNegativeAmount ? 'rgba(255, 0, 0, 0.15)' : 'inherit'
													}}
												>
													<TableCell>
														{isEditing ? (
															<DatePicker
																label={undefined}
																value={editDate}
																onChange={(v) => setEditDate(v)}
																slotProps={{ textField: { size: 'small' } }}
															/>
														) : (
															<span>{e.date || '—'}</span>
														)}
													</TableCell>
													<TableCell>
														{isEditing ? (
															<FormControl fullWidth size="small">
																<Select value={editBankType} onChange={(ev) => setEditBankType(ev.target.value as string)}>
																	{bankTypeOptions.map((opt) => (
																		<MenuItem key={opt} value={opt}>{opt}</MenuItem>
																	))}
																</Select>
															</FormControl>
														) : (
															<span>{e.bank_type || '—'}</span>
														)}
													</TableCell>
													<TableCell>
														{isEditing ? (
															<FormControl fullWidth size="small">
																<Select value={editCardType} onChange={(ev) => setEditCardType(ev.target.value as string)}>
																	{cardTypeOptions.map((opt) => (
																		<MenuItem key={opt} value={opt}>{opt}</MenuItem>
																	))}
																</Select>
															</FormControl>
														) : (
															<span>{e.card_type || '—'}</span>
														)}
													</TableCell>
													<TableCell>
														{isEditing ? (
															<FormControl fullWidth size="small">
																<Select value={editExpenseType} onChange={(ev) => setEditExpenseType(ev.target.value as string)}>
																	{expenseTypeOptions.map((opt) => (
																		<MenuItem key={opt} value={opt}>{opt}</MenuItem>
																	))}
																</Select>
															</FormControl>
														) : (
															<span>{e.expense_type || '—'}</span>
														)}
													</TableCell>
													<TableCell align="right">
														{isEditing ? (
															<TextField
																size="small"
																type="number"
																inputProps={{ step: '0.01' }}
																value={editAmount}
																onChange={(ev) => setEditAmount(ev.target.value)}
															/>
														) : (
															<span>{formatINR.format(e.amount)}</span>
														)}
													</TableCell>
													<TableCell>
														{isEditing ? (
															<TextField size="small" value={editRemark} onChange={(ev) => setEditRemark(ev.target.value)} />
														) : (
															<span>{e.remark || '—'}</span>
														)}
													</TableCell>
													<TableCell>
														{isEditing ? (
															<Box sx={{ display: 'flex', gap: 1 }}>
																<IconButton color="success" size="small" disabled={!isEditExpenseValid} onClick={saveEdit} aria-label="Save">
																	<CheckRoundedIcon />
																</IconButton>
																<IconButton color="inherit" size="small" onClick={cancelEdit} aria-label="Cancel">
																	<CloseRoundedIcon />
																</IconButton>
															</Box>
														) : (
															<Box sx={{ display: 'flex', gap: 1 }}>
																<IconButton size="small" onClick={() => startEdit(idx)} aria-label="Edit">
																	<EditRoundedIcon />
																</IconButton>
																<IconButton 
																	size="small" 
																	onClick={() => e.id && deleteExpense(e.id)} 
																	aria-label="Delete"
																	sx={{ color: 'error.main' }}
																>
																	<DeleteRoundedIcon />
																</IconButton>
															</Box>
														)}
													</TableCell>
												</TableRow>
											)
										})
									) : mode === 'investments' ? (
										filteredInvestments.map((i, idx) => {
											const isEditing = editingIndex === idx
											const hasNegativeValue = i.current_value < 0 || i.investment_amount < 0
											const isUsedForCalculation = isInvestmentUsedForCalculation(i)
											return (
												<TableRow 
													key={idx} 
													hover
													sx={{
														backgroundColor: hasNegativeValue 
															? 'rgba(255, 0, 0, 0.15)' 
															: isUsedForCalculation 
																? 'rgba(76, 175, 80, 0.2)' // Light green for calculation rows
																: 'inherit',
														borderLeft: isUsedForCalculation ? '4px solid #4caf50' : 'none'
													}}
												>
													<TableCell>
														{isEditing ? (
															<DatePicker
																label={undefined}
																value={editDate}
																onChange={(v) => setEditDate(v)}
																slotProps={{ textField: { size: 'small' } }}
															/>
														) : (
															<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
																<span>{i.date || '—'}</span>
																{isUsedForCalculation && (
																	<span 
																		style={{ 
																			fontSize: '0.7rem', 
																			color: '#4caf50', 
																			fontWeight: 'bold',
																			backgroundColor: 'rgba(76, 175, 80, 0.1)',
																			padding: '2px 6px',
																			borderRadius: '4px'
																		}}
																	>
																		✓ Used
																	</span>
																)}
															</Box>
														)}
													</TableCell>
													<TableCell>
														{isEditing ? (
															<FormControl fullWidth size="small">
																<Select value={editInvestmentMode} onChange={(ev) => setEditInvestmentMode(ev.target.value as string)}>
																	{investmentModeOptions.map((opt) => (
																		<MenuItem key={opt} value={opt}>{opt}</MenuItem>
																	))}
																</Select>
															</FormControl>
														) : (
															<span>{i.investment_mode || '—'}</span>
														)}
													</TableCell>
													<TableCell>
														{isEditing ? (
															<FormControl fullWidth size="small">
																<Select value={editInvestmentType} onChange={(ev) => setEditInvestmentType(ev.target.value as string)}>
																	{investmentTypeOptions.map((opt) => (
																		<MenuItem key={opt} value={opt}>{opt}</MenuItem>
																	))}
																</Select>
															</FormControl>
														) : (
															<span>{i.investment_type || '—'}</span>
														)}
													</TableCell>
													<TableCell align="right">
														{isEditing ? (
															<TextField
																size="small"
																type="number"
																inputProps={{ step: '0.01' }}
																value={editCurrentValue}
																onChange={(ev) => setEditCurrentValue(ev.target.value)}
															/>
														) : (
															<span>{formatINR.format(i.current_value)}</span>
														)}
													</TableCell>
													<TableCell align="right">
														{isEditing ? (
															<TextField
																size="small"
																type="number"
																inputProps={{ step: '0.01' }}
																value={editInvestmentAmount}
																onChange={(ev) => setEditInvestmentAmount(ev.target.value)}
															/>
														) : (
															<span>{formatINR.format(i.investment_amount)}</span>
														)}
													</TableCell>
													<TableCell align="right">
														<span style={{ color: i.return_value >= 0 ? 'green' : 'red' }}>
															{formatINR.format(i.return_value)}
														</span>
													</TableCell>
													<TableCell>
														{isEditing ? (
															<Box sx={{ display: 'flex', gap: 1 }}>
																<IconButton color="success" size="small" disabled={!isEditInvestmentValid} onClick={saveEdit} aria-label="Save">
																	<CheckRoundedIcon />
																</IconButton>
																<IconButton color="inherit" size="small" onClick={cancelEdit} aria-label="Cancel">
																	<CloseRoundedIcon />
																</IconButton>
															</Box>
														) : (
															<Box sx={{ display: 'flex', gap: 1 }}>
																<IconButton size="small" onClick={() => startEdit(idx)} aria-label="Edit">
																	<EditRoundedIcon />
																</IconButton>
																<IconButton 
																	size="small" 
																	onClick={() => i.id && deleteInvestment(i.id)} 
																	aria-label="Delete"
																	sx={{ color: 'error.main' }}
																>
																	<DeleteRoundedIcon />
																</IconButton>
															</Box>
														)}
													</TableCell>
												</TableRow>
											)
										})
									) : (
										// Total Assets mode - show combined expenses and latest investments up to cutoff date
										[
											...expensesUpToCutoff.map((e, idx) => ({
												type: 'Expense',
												data: e,
												index: idx,
												key: `expense-${idx}`,
												isUsedForCalculation: true // All expenses up to cutoff are used
											})),
											...latestInvestments.map((i, idx) => ({
												type: 'Investment',
												data: i,
												index: idx,
												key: `investment-${idx}`,
												isUsedForCalculation: true // All latest investments are used
											}))
										]
										.map((item) => (
											<TableRow 
												key={item.key} 
												hover
												sx={{
													backgroundColor: item.isUsedForCalculation 
														? (item.type === 'Expense' 
															? 'rgba(255, 107, 107, 0.2)' // Light red for expense calculation rows
															: 'rgba(76, 175, 80, 0.2)') // Light green for investment calculation rows
														: 'inherit',
													borderLeft: item.isUsedForCalculation 
														? `4px solid ${item.type === 'Expense' ? '#ff6b6b' : '#4caf50'}` 
														: 'none'
												}}
											>
												<TableCell>
													<span>{item.data.date || '—'}</span>
												</TableCell>
												<TableCell>
													<span style={{ 
														color: item.type === 'Expense' ? '#ff6b6b' : '#4ecdc4',
														fontWeight: 'bold'
													}}>
														{item.type}
													</span>
												</TableCell>
												<TableCell>
													<span>
														{item.type === 'Expense' 
															? (item.data as Expense).expense_type 
															: (item.data as Investment).investment_type
														}
													</span>
												</TableCell>
												<TableCell>
													<span>
														{item.type === 'Expense' 
															? (item.data as Expense).bank_type 
															: (item.data as Investment).investment_mode
														}
													</span>
												</TableCell>
												<TableCell align="right">
													<span style={{ 
														color: item.type === 'Expense' ? '#ff6b6b' : '#4ecdc4',
														fontWeight: 'bold'
													}}>
														{item.type === 'Expense' 
															? formatINR.format((item.data as Expense).amount)
															: formatINR.format((item.data as Investment).current_value)
														}
													</span>
												</TableCell>
												<TableCell>
													<span>
														{item.type === 'Expense' 
															? (item.data as Expense).remark
															: `ROI: ${formatINR.format((item.data as Investment).return_value)}`
														}
													</span>
												</TableCell>
												<TableCell>
													<IconButton 
														size="small" 
														onClick={() => {
															if (item.type === 'Expense') {
																setMode('expenses')
																setTimeout(() => startEdit(item.index), 100)
															} else {
																setMode('investments')
																setTimeout(() => startEdit(item.index), 100)
															}
														}} 
														aria-label="Edit"
													>
														<EditRoundedIcon />
													</IconButton>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
								<TableFooter>
									<TableRow>
										<TableCell colSpan={mode === 'expenses' ? 4 : mode === 'investments' ? 3 : 3} align="right"><strong>Total</strong></TableCell>
										{mode === 'expenses' ? (
											<>
												<TableCell align="right"><strong>{formatINR.format(totalExpenseAmount)}</strong></TableCell>
												<TableCell />
											</>
										) : mode === 'investments' ? (
											<>
												<TableCell align="right"><strong>{formatINR.format(totalCurrentValue)}</strong></TableCell>
												<TableCell align="right"><strong>{formatINR.format(totalInvestmentAmount)}</strong></TableCell>
												<TableCell align="right">
													<strong style={{ color: totalReturnValue >= 0 ? 'green' : 'red' }}>
														{formatINR.format(totalReturnValue)}
													</strong>
												</TableCell>
											</>
										) : (
											<>
												<TableCell align="right"><strong>{formatINR.format(totalExpenseAmount + totalCurrentValue)}</strong></TableCell>
												<TableCell />
											</>
										)}
										<TableCell />
									</TableRow>
								</TableFooter>
							</Table>
						</TableContainer>
					</Box>
				)}

				{/* Expense Charts - Show only in expenses mode, all expenses view, and charts view */}
				{mode === 'expenses' && showAll && expenses.length > 0 && expenseViewMode === 'charts' && (
					<ExpenseCharts expenses={filteredExpenses} allExpenses={expenses} onResetFilters={resetFilters} />
				)}

				{/* Investment Charts - Show only in investments mode, all investments view, and charts view */}
				{mode === 'investments' && showAll && investments.length > 0 && investmentViewMode === 'charts' && (
					<InvestmentCharts investments={filteredInvestments} allInvestments={investments} onResetFilters={resetFilters} />
				)}
			</LocalizationProvider>
			</div>
		</ProtectedRoute>
	)
}
