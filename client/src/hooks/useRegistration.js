/**
 * hooks/useRegistration.js
 * Manages the multi-step registration form state and API calls.
 */

import { useState, useCallback } from 'react';
import { registrationApi, paymentApi } from '../lib/api';
import { calculateTotal } from '../lib/utils';

const INITIAL_FORM = {
  // Step 1
  designation: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  country: '',
  office: '',
  category: '',
  church: '',
  // Step 2
  accommodation: false,
  accommodation_nights: 0,
  num_people: 1,
  delegate_details: [],
  dietary_requirements: '',
  special_requests: '',
  terms_accepted: false,
  // Hotel selection
  hotel_id: null,
  hotel_name: '',
  hotel_price_usd: 0,
  hotel_rooms: 1,
  hotel_booking_id: null,
  // Step 3
  paymentMethod: 'ecocash',
  currency: 'USD',
  mobilePhone: '',
};

export function useRegistration() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [registrantId, setRegistrantId] = useState(null);
  const [registrationRef, setRegistrationRef] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [redirectUrl, setRedirectUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateForm = useCallback((fields) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  }, []);

  const nextStep = useCallback(() => setStep((s) => Math.min(s + 1, 3)), []);
  const prevStep = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  /**
   * Submit step 1+2 data to create the registration record.
   * If a registration already exists (user went back and resubmitted), skip creation.
   */
  const submitRegistration = useCallback(async (submittedData) => {
    const payload = submittedData || formData;
    setIsLoading(true);
    setError(null);
    try {
      // If registration already exists, just move to next step
      if (registrantId) {
        nextStep();
        return;
      }

      const { data } = await registrationApi.submit(payload);
      const createdRegistrantId = data.registrantId;
      setRegistrantId(createdRegistrantId);
      setRegistrationRef(data.registrationRef);
      nextStep();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed. Please try again.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [formData, registrantId, nextStep]);

  /**
   * Initiate the Paynow payment for step 3.
   * Accepts paymentOptions to override formData (for current payment attempt)
   */
  const initiatePayment = useCallback(async (paymentOptions = {}) => {
    if (!registrantId) {
      setError('Registration not found. Please restart the form.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Use passed options or fall back to formData
      const paymentMethod = paymentOptions.paymentMethod || formData.paymentMethod;
      const mobilePhone = paymentOptions.mobilePhone !== undefined ? paymentOptions.mobilePhone : formData.mobilePhone;
      const isMobileMoney = ['ecocash', 'telecash'].includes(paymentMethod);

      // Compute amount from formData to keep pricing consistent with UI
      const amount = calculateTotal(
        formData.category,
        formData.num_people || 1,
        formData.delegate_details || []
      );

      // Route all registration payments through the PayNow gateway, including card payments.
      const { data } = await paymentApi.initiate({
        registrantId,
        paymentMethod,
        currency: formData.currency,
        ...(isMobileMoney && mobilePhone ? { phone: mobilePhone } : {}),
      });
      setPaymentId(data.paymentId);
      if (data.redirectUrl) {
        setRedirectUrl(data.redirectUrl);
        window.location.href = data.redirectUrl;
      }
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Payment initiation failed. Please try again.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [registrantId, formData]);

  return {
    step,
    formData,
    updateForm,
    nextStep,
    prevStep,
    registrantId,
    registrationRef,
    paymentId,
    redirectUrl,
    isLoading,
    error,
    submitRegistration,
    initiatePayment,
  };
}
