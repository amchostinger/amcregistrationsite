import React from 'react';
import axios from 'axios';

export default function PaymentButton({ orderId, amount, currency = 'USD', customerName, customerEmail, children }) {
  const handleClick = async () => {
    try {
      const resp = await axios.post('/api/payments/create', {
        orderId,
        amount,
        currency,
        customerName,
        customerEmail,
      }, { timeout: 10000 });

      if (resp?.data?.success && resp?.data?.paymentUrl) {
        window.location.href = resp.data.paymentUrl;
        return;
      }

      console.error('Payment creation failed', resp?.data);
      alert('Failed to create payment. Please try again.');
    } catch (err) {
      console.error('Payment create error', err);
      alert('Network error while creating payment.');
    }
  };

  return (
    <button onClick={handleClick} className="btn-primary">
      {children || 'Pay Now'}
    </button>
  );
}
