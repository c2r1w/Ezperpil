// Simple Stripe payment test page
'use client';



import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CardElement, PaymentRequestButtonElement, useStripe, useElements } from '@stripe/react-stripe-js';

const STRIPE_PUBLIC_KEY = 'pk_test_51RePbIDH5IrdUh93LpBCPK029XCSv3T1FclVkaUrphNAV5lVWMUkl5My0fa95aw86c6DrGEhUEEdW9K1Igq7EJwQ00UbMO2NMs';
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);


function ElementsCheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  React.useEffect(() => {
    if (stripe && amount) {
      const pr = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: 'Total',
          amount: Math.round(Number(amount) * 100) || 100,
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });
      pr.canMakePayment().then(result => {
        if (result) {
          setCanMakePayment(true);
          setPaymentRequest(pr);
        } else {
          setCanMakePayment(false);
        }
      });
    } else {
      setCanMakePayment(false);
      setPaymentRequest(null);
    }
  }, [stripe, amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch('/api/stripe-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const data = await res.json();
      if (!data.clientSecret) throw new Error('No client secret returned');
      if (!stripe || !elements) throw new Error('Stripe.js not loaded');
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('CardElement not found');
      const { error: stripeError } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });
      if (stripeError) throw stripeError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
      <div>
        <label className="block mb-1">Amount (USD)</label>
        <input
          type="number"
          min="1"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="border px-2 py-1 rounded w-full"
          required
        />
      </div>
      {canMakePayment && paymentRequest ? (
        <div className="mb-2">
          <PaymentRequestButtonElement options={{ paymentRequest, style: { paymentRequestButton: { type: 'default', theme: 'dark', height: '44px' } } }} />
          <div className="text-xs text-gray-500 mt-1">Apple Pay / Google Pay / Browser Pay</div>
        </div>
      ) : (
        <div className="mb-2">
          <CardElement options={{ hidePostalCode: true }} />
        </div>
      )}
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full" disabled={loading}>
        {loading ? 'Processing...' : 'Pay'}
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {success && (
        <button className="bg-green-600 text-white px-4 py-2 rounded w-full mt-4" onClick={() => alert('Success Action!')}>
          Continue (Payment Successful)
        </button>
      )}
      <div className="mt-6 text-sm text-gray-500">
        Use Stripe test card: 4242 4242 4242 4242, any future date, any CVC
      </div>
    </form>
  );
}

function StripeTestPage() {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h2 className="text-2xl mb-4">Stripe Payment Test (Elements)</h2>
      <Elements stripe={stripePromise}>
        <ElementsCheckoutForm />
      </Elements>
    </div>
  );
}

export default StripeTestPage;
