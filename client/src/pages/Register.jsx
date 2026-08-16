import { useEffect } from "react";
import toast from "react-hot-toast";
import { Check } from "lucide-react";
import { useRegistration } from "../hooks/useRegistration";
import { Step1Form, Step2Form } from "../components/registration/RegistrationForm";
import PaymentStep from "../components/registration/PaymentStep";
import ConfirmationStep from "../components/registration/ConfirmationStep";

const STEPS = [
  { num: 1, label: "Personal Details" },
  { num: 2, label: "Additional Details" },
  { num: 3, label: "Payment" },
];

const REGISTER_HERO = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80";

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, i) => (
        <div key={step.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-body font-bold transition-all duration-300"
              style={
                currentStep > step.num
                  ? { background: "#059669", color: "white", boxShadow: "0 0 0 4px rgba(5,150,105,0.15)" }
                  : currentStep === step.num
                  ? { background: "var(--color-navy)", color: "white", boxShadow: "0 0 0 4px rgba(26,47,78,0.15)" }
                  : { background: "#f3f4f6", color: "#9ca3af", border: "2px solid #e5e7eb" }
              }
            >
              {currentStep > step.num ? <Check size={16} strokeWidth={3} /> : step.num}
            </div>
            <span
              className="text-xs mt-2 font-body font-semibold hidden sm:block whitespace-nowrap"
              style={{ color: currentStep === step.num ? "var(--color-navy)" : currentStep > step.num ? "#059669" : "var(--color-muted)" }}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="w-8 sm:w-24 h-px mx-2 sm:mx-3 mb-5 rounded-full transition-all duration-300"
              style={{ background: currentStep > step.num ? "#059669" : "#e5e7eb" }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Register() {
  const {
    step, formData, updateForm, nextStep, prevStep,
    registrantId, registrationRef, paymentId,
    isLoading, error, submitRegistration, initiatePayment,
  } = useRegistration();

  useEffect(() => { if (error) toast.error(error); }, [error]);

  const isCompleted = step > 3;

  const handleStep1 = (data) => { updateForm(data); nextStep(); };
  const handleStep2 = async (data) => {
    const mergedData = { ...formData, ...data };
    updateForm(data);
    await submitRegistration(mergedData);
  };
  const handlePayment = async (paymentOptions) => { updateForm(paymentOptions); return await initiatePayment(paymentOptions); };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
      {/* Page header */}
      <div className="relative overflow-hidden" style={{ background: "var(--navy-gradient)", paddingTop: "6rem", paddingBottom: "3.5rem", marginTop: "-80px" }}>
        <div className="absolute inset-0 bg-center bg-cover opacity-15" style={{ backgroundImage: `url("${REGISTER_HERO}")` }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(15,30,51,0.65), rgba(15,30,51,0.92))" }} />
        <div className="section-container text-center relative z-10 pt-6">
          <span className="section-label">AMC 2027</span>
          <h1 style={{ fontFamily: "Cinzel, serif" }} className="page-title text-white mb-3">
            Conference Registration
          </h1>
          <div style={{ height: "3px", width: "48px", background: "var(--gold-gradient)", margin: "0 auto" }} className="rounded-full" />
          <p className="font-body text-white/60 text-sm mt-3">3rd General Conference 2027 &middot; Harare, Zimbabwe</p>
        </div>
      </div>

      <div className="section-container max-w-2xl mx-auto py-8 sm:py-12">
        {!isCompleted && <StepIndicator currentStep={step} />}

        <div className="card">
          {step === 1 && (
            <>
              <div className="mb-6">
                <h2 style={{ fontFamily: "Cinzel, serif", color: "var(--color-navy)" }} className="text-lg sm:text-xl font-bold uppercase tracking-wide">Personal Information</h2>
                <p className="font-body text-gray-500 text-sm mt-1">Please enter your personal and professional details.</p>
              </div>
              <Step1Form defaultValues={formData} onNext={handleStep1} />
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-6">
                <h2 style={{ fontFamily: "Cinzel, serif", color: "var(--color-navy)" }} className="text-lg sm:text-xl font-bold uppercase tracking-wide">Additional Details</h2>
                <p className="font-body text-gray-500 text-sm mt-1">Accommodation preferences and special requirements.</p>
              </div>
              <Step2Form defaultValues={formData} onNext={handleStep2} onBack={prevStep} />
              {isLoading && (
                <div className="flex items-center justify-center gap-2.5 mt-4 font-body text-sm" style={{ color: "var(--color-navy)" }}>
                  <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--color-navy)", borderTopColor: "transparent" }} />
                  Submitting registration...
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <div className="mb-6">
                <h2 style={{ fontFamily: "Cinzel, serif", color: "var(--color-navy)" }} className="text-lg sm:text-xl font-bold uppercase tracking-wide">Payment</h2>
                <p className="font-body text-gray-500 text-sm mt-1">Complete your registration payment to confirm your place.</p>
              </div>
              <PaymentStep formData={formData} registrationRef={registrationRef} onInitiate={handlePayment} onBack={prevStep} isLoading={isLoading} />
            </>
          )}

          {isCompleted && (
            <ConfirmationStep registrationRef={registrationRef} registrant={{ ...formData, registration_ref: registrationRef }} />
          )}
        </div>

        {!isCompleted && (
          <p className="text-center font-body text-xs mt-5" style={{ color: "var(--color-muted)" }}>
            Having trouble? Contact{" "}
            <a href="mailto:conference@africamethodistcouncil.org" className="underline hover:text-navy transition-colors break-words" style={{ color: "var(--color-navy)" }}>
              conference@africamethodistcouncil.org
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
