'use client'

import { useState } from 'react'
import { createOnlineOrder, verifyOnlinePayment } from '../actions'

interface OnlinePaymentButtonProps {
  billId: string
  amount: number // Grand total in Rupees
  billMonthName: string
  residentName: string
  residentPhone: string
  societyName: string
  className?: string
  buttonText?: string
}

export default function OnlinePaymentButton({
  billId,
  amount,
  billMonthName,
  residentName,
  residentPhone,
  societyName,
  className = 'btn btn-primary w-full py-2.5 text-xs font-semibold',
  buttonText
}: OnlinePaymentButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePayment = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Load Razorpay SDK client-side
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay checkout script. Check your internet connection.')
      }

      // 2. Call server action to create order
      const orderRes = await createOnlineOrder(billId)
      if (!orderRes.success) {
        throw new Error(orderRes.error)
      }

      const { orderId, amount: amountInPaise, keyId } = orderRes.data

      // 3. Define Razorpay checkout options
      const options = {
        key: keyId,
        amount: amountInPaise,
        currency: 'INR',
        name: societyName,
        description: `Maintenance Bill for ${billMonthName}`,
        order_id: orderId,
        handler: async function (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) {
          try {
            setLoading(true)
            // 4. Verify payment via server action
            const verifyRes = await verifyOnlinePayment({
              billId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })

            if (!verifyRes.success) {
              throw new Error(verifyRes.error)
            }

            // Reload page or let component update since server action triggers revalidation
            window.location.reload()
          } catch (err: any) {
            setError(err.message || 'Payment verification failed.')
            setLoading(false)
          }
        },
        prefill: {
          name: residentName,
          contact: residentPhone || '',
        },
        theme: {
          color: '#4F46E5', // Matches premium indigo styling
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
          }
        }
      }

      // 5. Open checkout overlay
      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (resp: any) {
        setError(resp.error.description || 'Payment transaction failed.')
        setLoading(false)
      })
      rzp.open()

    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <button
        onClick={handlePayment}
        disabled={loading}
        className={`${className} flex items-center justify-center gap-2 disabled:opacity-50`}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </>
        ) : (
          buttonText || `Pay Now ₹${amount.toLocaleString('en-IN')}`
        )}
      </button>

      {error && (
        <p className="text-[10px] text-rose-400 text-center mt-2 font-medium bg-rose-500/10 py-1.5 px-2 rounded-lg border border-rose-500/20">
          ⚠️ {error}
        </p>
      )}
    </div>
  )
}
