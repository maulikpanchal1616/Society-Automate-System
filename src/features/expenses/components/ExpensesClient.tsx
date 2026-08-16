'use client'

import { useState } from 'react'
import { Plus, Search, FileText, CheckCircle, Lock, Trash2, Edit2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { changeExpenseStatusAction, deleteExpenseAction } from '../actions'
import ExpenseFormDialog from './ExpenseFormDialog'
import { CustomSelect } from '@/components/ui/CustomSelect'

export default function ExpensesClient({ initialExpenses, userRole }: { initialExpenses: any[], userRole: string }) {
  const [expenses, setExpenses] = useState(initialExpenses)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)

  const filtered = expenses.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.paid_to.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || e.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalAmount = filtered.reduce((acc, e) => acc + Number(e.amount), 0)

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense record?')) return
    const res = await deleteExpenseAction(id)
    if (res.success) {
      setExpenses(prev => prev.filter(e => e.id !== id))
    } else {
      alert(res.error)
    }
  }

  async function handleStatusChange(id: string, newStatus: 'approved' | 'locked') {
    if (!confirm(`Mark this expense as ${newStatus}?`)) return
    const res = await changeExpenseStatusAction(id, newStatus)
    if (res.success) {
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e))
    } else {
      alert(res.error)
    }
  }

  function handleFormSuccess(savedExpense: any) {
    if (editingExpense) {
      setExpenses(prev => prev.map(e => e.id === savedExpense.id ? savedExpense : e))
    } else {
      setExpenses(prev => [savedExpense, ...prev])
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h1 className="text-2xl font-bold text-[#2D2A26]">Society Expenses</h1>
        <button 
          onClick={() => { setEditingExpense(null); setIsFormOpen(true); }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Record Expense
        </button>
      </div>

      <div className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center bg-white/50">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search expenses..."
              className="pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm w-full bg-white text-slate-800"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <CustomSelect 
            className="w-full sm:w-40 shrink-0"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'draft', label: 'Drafts' },
              { value: 'approved', label: 'Approved' },
              { value: 'locked', label: 'Locked' },
            ]}
          />
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-slate-200">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Filtered Total</p>
          <p className="text-xl font-bold text-[#C56E4D]">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden bg-white">
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[700px]">
            <thead className="bg-[#F5F1EB] text-[#8C8680] text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-semibold">Date & Title</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No expense records found.
                  </td>
                </tr>
              ) : (filtered || []).map(expense => (
                <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-800">{expense.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(expense.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • To: {expense.paid_to}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-6 py-4">
                    {expense.status === 'draft' && <span className="badge bg-slate-100 text-slate-600 border border-slate-200">Draft</span>}
                    {expense.status === 'approved' && <span className="badge bg-[#7A8B74]/10 text-[#7A8B74] border border-[#7A8B74]/20"><CheckCircle size={10} className="mr-1 inline" /> Approved</span>}
                    {expense.status === 'locked' && <span className="badge bg-slate-800 text-white border border-slate-700"><Lock size={10} className="mr-1 inline" /> Locked</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      {expense.status === 'draft' && (
                        <>
                          <button 
                            onClick={() => { setEditingExpense(expense); setIsFormOpen(true); }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(expense.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                          {userRole === 'chairman' && (
                            <button onClick={() => handleStatusChange(expense.id, 'approved')} className="px-3 py-1 bg-[#7A8B74] text-white text-xs rounded hover:bg-[#5A6855] transition-colors">
                              Approve
                            </button>
                          )}
                        </>
                      )}
                      
                      {expense.status === 'approved' && userRole === 'chairman' && (
                        <button onClick={() => handleStatusChange(expense.id, 'locked')} className="px-3 py-1 bg-slate-800 text-white text-xs rounded hover:bg-slate-900 transition-colors">
                          Lock Record
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ExpenseFormDialog 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        existingExpense={editingExpense}
      />
    </div>
  )
}
