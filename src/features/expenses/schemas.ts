import { z } from 'zod'

export const expenseStatusSchema = z.enum(['draft', 'approved', 'locked'])

export const expenseFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  category: z.string().min(1, "Please select a category"),
  amount: z.number().positive("Amount must be greater than 0"),
  expense_date: z.string().min(1, "Expense date is required"),
  paid_to: z.string().min(1, "Recipient is required").max(100),
  payment_mode: z.enum(['cash', 'upi', 'bank_transfer', 'cheque', 'other']),
  notes: z.string().max(500).optional().nullable(),
  attachment_url: z.string().url().optional().nullable(),
})

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>
export type ExpenseStatus = z.infer<typeof expenseStatusSchema>
