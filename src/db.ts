import Dexie, { Table } from 'dexie'

export type ExpenseRow = {
	id?: number
	date: string
	amount: number
	remark: string
	bankType: string
	cardType: string
	expenseType: string
}

export type OptionListRow = {
	key: string
	items: string[]
}

export class MyFinanceDB extends Dexie {
	expenses!: Table<ExpenseRow, number>
	lists!: Table<OptionListRow, string>

	constructor() {
		super('myFinanceDB')
		// v1: initial expenses table
		this.version(1).stores({
			expenses: '++id, date, bankType, cardType, expenseType, amount',
		})
		// v2: add key-value lists table for option persistence
		this.version(2).stores({
			expenses: '++id, date, bankType, cardType, expenseType, amount',
			lists: '&key',
		})
	}
}

export const db = new MyFinanceDB()
