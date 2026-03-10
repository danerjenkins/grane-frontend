import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  formatBakeDay,
  getPickupWindowLabel,
  PICKUP_HELP_TEXT,
  PICKUP_LOCATION_LABEL,
} from '../config/pickup';

type PickupInfoCardProps = {
  bakeDayDate?: string | null;
  variant?: 'checkout' | 'success';
};

export default function PickupInfoCard({
  bakeDayDate,
  variant = 'checkout',
}: PickupInfoCardProps) {
  const formattedDate = formatBakeDay(bakeDayDate);
  const pickupWindow = getPickupWindowLabel(bakeDayDate);

  return (
    <div className="admin-card p-5">
      <div className="mb-4 flex items-center gap-2 text-base font-semibold text-text">
        <MapPin className="h-5 w-5 text-brand-strong" aria-hidden="true" />
        <span>Pickup Details</span>
      </div>

      <div className="space-y-2 text-sm text-text">
        <div className="flex items-start gap-2">
          <span className="font-semibold">Date:</span>
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-semibold">Time:</span>
          <span>{pickupWindow}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-semibold">Location:</span>
          <span>{PICKUP_LOCATION_LABEL}</span>
        </div>
      </div>

      <p className="mt-4 text-sm text-secondary">{PICKUP_HELP_TEXT}</p>

      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-text">
        <Link to="/about#faq-5" className="underline transition hover:text-secondary">
          Why bake days?
        </Link>
        <Link to="/about#faq-7" className="underline transition hover:text-secondary">
          Ordering details
        </Link>
      </div>

      {variant === 'checkout' ? (
        <p className="mt-3 text-xs text-secondary">
          After checkout, you will see these pickup details again on the confirmation screen.
        </p>
      ) : (
        <p className="mt-3 text-xs text-secondary">
          Come anytime during the pickup window, no appointment needed.
        </p>
      )}
    </div>
  );
}
