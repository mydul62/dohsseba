'use client';

import React, { useState } from 'react';
import { ServiceItem } from '@/types/service';
import { formatCurrency } from '@/utils/cn';
import { X, Calendar, Clock, MapPin, CheckCircle, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

interface QuickBookingModalProps {
  service: ServiceItem | null;
  onClose: () => void;
}

export function QuickBookingModal({ service, onClose }: QuickBookingModalProps) {
  const [selectedDate, setSelectedDate] = useState('Today (Within 2 Hours)');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isBooked, setIsBooked] = useState(false);

  if (!service) return null;

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooked(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-3xl bg-background border border-border shadow-2xl p-6 overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 p-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {isBooked ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold">Booking Request Confirmed!</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {service.providerName} has received your booking request for{' '}
                  <strong className="text-foreground">{service.title}</strong>.
                </p>
              </div>
              <div className="p-4 bg-secondary/60 rounded-2xl text-xs space-y-1 text-left">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking ID:</span>
                  <span className="font-mono font-bold">#DOHS-9842</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Schedule:</span>
                  <span className="font-semibold">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Price:</span>
                  <span className="font-bold text-primary">{formatCurrency(service.price)}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleConfirmBooking} className="space-y-5">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-secondary flex-shrink-0">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {service.categoryName}
                  </span>
                  <h3 className="font-bold text-base leading-tight mt-0.5">{service.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    By {service.providerName}
                  </p>
                  <div className="text-lg font-bold text-primary mt-1">
                    {formatCurrency(service.price)}{' '}
                    <span className="text-xs text-muted-foreground font-normal">
                      / {service.priceUnit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" />
                    Select Date & Time Slot
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option>Today (Within 2 Hours)</option>
                    <option>Tomorrow Morning (9:00 AM - 12:00 PM)</option>
                    <option>Tomorrow Afternoon (2:00 PM - 5:00 PM)</option>
                    <option>Custom Date (Specify in Notes)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    Service Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-input bg-background font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="Enter your house/flat address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    Additional Notes / Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 rounded-xl border border-input bg-background font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="e.g. Please bring extra 10ft wire, call before arrival"
                  />
                </div>
              </div>

              {/* Guarantees */}
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                <span>Verified Provider Guarantee & 7-Day Free Re-service Coverage</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm hover:opacity-95 shadow-md transition-all"
                >
                  Confirm Booking ({formatCurrency(service.price)})
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
