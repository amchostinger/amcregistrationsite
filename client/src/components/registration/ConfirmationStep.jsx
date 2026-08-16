import { Link } from "react-router-dom";
import { CheckCircle, Calendar, MapPin, Mail, Printer, Home } from "lucide-react";
import { formatCurrency } from "../../lib/utils";

export default function ConfirmationStep({ registrationRef, registrant, payment }) {
  return (
    <div id="confirmation-print">
      {/* Success Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5"
          style={{ background: "rgba(5,150,105,0.1)", border: "2px solid rgba(5,150,105,0.3)" }}>
          <CheckCircle size={40} className="text-emerald-600" />
        </div>
        <h2 style={{ fontFamily: "Cinzel, serif" }} className="text-xl sm:text-2xl font-bold text-navy mb-2">Registration Confirmed!</h2>
        <p className="font-body text-gray-500 text-sm">Your payment has been received and your place is secured.</p>
      </div>

      {/* Reference Badge */}
      <div className="rounded-2xl p-6 text-center mb-6"
        style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)" }}>
        <p className="font-body text-navy text-xs font-bold uppercase tracking-widest mb-2">Booking Reference</p>
        <p style={{ fontFamily: "Cinzel, serif" }} className="text-2xl sm:text-3xl font-bold text-navy break-all">{registrationRef}</p>
        <p className="font-body text-gray-500 text-xs mt-2">Keep this reference for check-in at the conference</p>
      </div>

      {/* Details Grid */}
      {registrant && (
        <div className="rounded-2xl p-5 mb-6 bg-white" style={{ border: "1px solid rgba(232,224,208,0.8)" }}>
          <h4 className="font-heading font-bold text-navy text-sm uppercase tracking-wider mb-4">Registrant Details</h4>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 font-body text-sm">
            <dt className="text-gray-500">Name</dt>
            <dd className="font-semibold text-navy">{registrant.designation} {registrant.first_name} {registrant.last_name}</dd>
            <dt className="text-gray-500">Category</dt>
            <dd className="font-semibold text-navy">{registrant.category}</dd>
            <dt className="text-gray-500">Church</dt>
            <dd className="font-semibold text-navy">{registrant.church || "—"}</dd>
            <dt className="text-gray-500">Country</dt>
            <dd className="font-semibold text-navy">{registrant.country}</dd>
            {registrant.hotel_name && (
              <>
                <dt className="text-gray-500">Preferred Hotel</dt>
                <dd className="font-semibold text-navy">{registrant.hotel_name}</dd>
              </>
            )}
            {registrant.hotel_website_url && (
              <>
                <dt className="text-gray-500">Hotel Website</dt>
                <dd className="font-semibold text-navy break-words"><a href={registrant.hotel_website_url} target="_blank" rel="noreferrer" className="underline text-blue-600">Visit hotel website</a></dd>
              </>
            )}
            {payment && (
              <>
                <dt className="text-gray-500">Amount Paid</dt>
                <dd className="font-semibold text-navy">{formatCurrency(payment.amount)} {payment.currency}</dd>
                <dt className="text-gray-500">Payment Method</dt>
                <dd className="font-semibold text-navy capitalize">{payment.payment_method}</dd>
              </>
            )}
          </dl>
        </div>
      )}

      {/* Conference Info */}
      <div className="rounded-2xl p-5 mb-6" style={{ border: "1px solid rgba(26,47,78,0.15)", background: "rgba(26,47,78,0.03)" }}>
        <h4 className="font-heading font-bold text-navy text-sm uppercase tracking-wider mb-4">Conference Details</h4>
        <div className="space-y-2.5 font-body text-sm text-gray-600">
          <div className="flex items-center gap-2.5">
            <Calendar size={14} style={{ color: "var(--color-gold)", flexShrink: 0 }} />
            <span><strong className="text-navy">Dates:</strong> March 9–14, 2027</span>
          </div>
          <div className="flex items-center gap-2.5">
            <MapPin size={14} style={{ color: "var(--color-gold)", flexShrink: 0 }} />
            <span><strong className="text-navy">Venue:</strong> Rainbow Towers Hotel & Conference Centre, Harare, Zimbabwe</span>
          </div>
          {registrant.hotel_website_url && (
            <div className="flex items-center gap-2.5">
              <Mail size={14} style={{ color: "var(--color-gold)", flexShrink: 0 }} />
              <span>Accommodation is booked separately. Use the hotel website link above to complete your stay.</span>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <Mail size={14} style={{ color: "var(--color-gold)", flexShrink: 0 }} />
            <span>A confirmation email has been sent to your registered email address.</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 no-print">
        <button onClick={() => window.print()}
          className="btn-outline flex-1 gap-2">
          <Printer size={16} /> Print Confirmation
        </button>
        <Link to="/" className="btn-primary flex-1 justify-center gap-2">
          <Home size={16} /> Return to Home
        </Link>
      </div>
    </div>
  );
}
