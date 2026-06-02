'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { expenseFormSchema, ExpenseFormValues } from '../schemas'
import { createExpenseAction, updateExpenseAction } from '../actions'

export default function ExpenseFormDialog({ 
  isOpen, 
  onClose,
  onSuccess,
  existingExpense = null 
}: { 
  isOpen: boolean, 
  onClose: () => void,
  onSuccess: (data: any) => void,
  existingExpense?: any 
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: existingExpense ? {
      title: existingExpense.title,
      category: existingExpense.category || '',
      amount: Number(existingExpense.amount) || 0,
      expense_date: existingExpense.expense_date,
      paid_to: existingExpense.paid_to,
      payment_mode: existingExpense.payment_mode || 'cash',
      notes: existingExpense.notes || '',
    } : {
      title: '',
      category: '',
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      paid_to: '',
      payment_mode: 'cash',
      notes: '',
    }
  })

  async function onSubmit(data: ExpenseFormValues) {
    setLoading(true)
    setError('')
    try {
      const res = existingExpense 
        ? await updateExpenseAction(existingExpense.id, data)
        : await createExpenseAction(data)
        
      if (res.success) {
        onSuccess(res.data)
        onClose()
      } else {
        setError(res.error || 'Failed to save expense')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-[#F5F1EB] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-[#E6E1D8] flex justify-between items-center bg-white">
          <h2 className="text-lg font-bold text-[#2D2A26]">{existingExpense ? 'Edit Expense' : 'Record Expense'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mb-4">{error}</div>}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Title / Description</label>
            <input type="text" {...register('title')} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm" placeholder="e.g., Plumber fix" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
              <select {...register('category')} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm">
                <option value="">Select...</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Repairs">Repairs</option>
                <option value="Staff Salary">Staff Salary</option>
                <option value="Security">Security</option>
                <option value="Water Supply">Water Supply</option>
                <option value="Electricity">Electricity</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Vendor Payments">Vendor Payments</option>
                <option value="Other">Other</option>
              </select>
              {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Amount</label>
              <input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold" />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
              <input type="date" {...register('expense_date')} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm" />
              {errors.expense_date && <p className="text-xs text-red-500 mt-1">{errors.expense_date.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Mode</label>
              <select {...register('payment_mode')} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm">
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Paid To (Vendor/Person)</label>
            <input type="text" {...register('paid_to')} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm" />
            {errors.paid_to && <p className="text-xs text-red-500 mt-1">{errors.paid_to.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</label>
            <textarea {...register('notes')} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm" rows={2} />
          </div>

          <div className="pt-4 border-t border-[#E6E1D8] flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary px-6 py-2 text-sm">
              {loading ? 'Saving...' : existingExpense ? 'Save Changes' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
