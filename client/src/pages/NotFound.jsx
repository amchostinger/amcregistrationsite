/**
 * pages/NotFound.jsx — Custom 404 page with AMC branding.
 */

import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="font-heading font-bold text-navy text-lg">AMC</span>
        </div>

        <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-2">Error 404</p>
        <h1 className="font-heading text-5xl font-bold text-white mb-4">Page Not Found</h1>
        <p className="text-white/60 mb-8">
          The page you are looking for does not exist or may have been moved.
          Return to the conference home page to find what you need.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn-gold">
            Return to Home
          </Link>
          <Link to="/register" className="btn-outline border-white text-white hover:bg-white hover:text-navy">
            Register Now
          </Link>
        </div>

        <p className="text-white/30 text-xs mt-10">
          AMC 3rd General Conference 2027 · Harare, Zimbabwe
        </p>
      </div>
    </div>
  );
}
