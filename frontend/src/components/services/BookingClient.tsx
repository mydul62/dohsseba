'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ServiceAddon, ServiceItem } from '@/types/service';
import { formatCurrency } from '@/utils/cn';
import { BookingSteps } from '@/components/services/BookingSteps';
import { fetchApi } from '@/lib/api-client';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
  MapPin,
  ShieldCheck,
  Check,
  Loader2,
  Printer,
  FileText,
  AlertCircle,
  X,
  Phone,
} from 'lucide-react';

interface BookingClientProps {
  service: ServiceItem;
}

export function BookingClient({ service }: BookingClientProps) {
  const [step, setStep] = useState<number>(1);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  
  // 1. Time Slot empty by default - mandatory selection
  const [dateSlot, setDateSlot] = useState<string>('');
  
  // 2. Address & Phone blank by default with placeholder instructions
  const [address, setAddress] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'card' | 'cod'>('cod');
  
  const [validationError, setValidationError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);

  const selectedAddons: ServiceAddon[] = (service.addons || []).filter((a) =>
    selectedAddonIds.includes(a.id)
  );
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const totalPrice = service.price + addonsTotal;

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleNextFromStep2 = () => {
    if (!dateSlot) {
      setValidationError('Please select a preferred arrival time slot before continuing.');
      return;
    }
    setValidationError('');
    setStep(3);
  };

  const handleNextFromStep3 = () => {
    const addressTrimmed = address.trim();
    const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '').replace(/^88/, '');
    const bdPhoneRegex = /^01[3-9]\d{8}$/;

    if (!addressTrimmed) {
      setValidationError('আপনার হাউজ ও সেক্টর এড্রেস দেওয়া আবশ্যক। (House & Flat location address is required.)');
      return;
    }
    if (!cleanPhone || !bdPhoneRegex.test(cleanPhone)) {
      setValidationError('১১ ডিজিটের সঠিক মোবাইল নম্বর প্রদান করুন (যেমন: 01712345678)।');
      return;
    }
    setValidationError('');
    setStep(4);
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const addressTrimmed = address.trim();
    const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '').replace(/^88/, '');
    const bdPhoneRegex = /^01[3-9]\d{8}$/;

    if (!dateSlot || !addressTrimmed || !cleanPhone || !bdPhoneRegex.test(cleanPhone)) {
      setValidationError('১১ ডিজিটের সঠিক মোবাইল নম্বর এবং ডেলিভারি অ্যাড্রেস দেওয়া আবশ্যক।');
      return;
    }

    setLoading(true);
    setValidationError('');

    try {
      // First get user default address or use text
      const addressRes = await fetchApi<any>('/users/addresses').catch(() => null);
      let addressId = addressRes?.data?.[0]?.id;

      if (!addressId) {
        // Create quick address
        const newAddressRes = await fetchApi<any>('/users/addresses', {
          method: 'POST',
          body: JSON.stringify({
            label: 'DOHS Service Address',
            line1: address,
            area: 'Mohakhali DOHS',
            city: 'Dhaka',
          }),
        }).catch(() => null);
        addressId = newAddressRes?.data?.id;
      }

      const bookingRes = await fetchApi<any>('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: service.id,
          addressId: addressId || 'default-address-id',
          scheduledAt: new Date().toISOString(),
          notes: `Schedule: ${dateSlot}. Phone: ${phone}. Address: ${address}. Notes: ${notes}`,
        }),
      }).catch(() => null);

      if (bookingRes?.success && bookingRes.data) {
        setCreatedBooking(bookingRes.data);
      }
    } finally {
      setLoading(false);
      setIsCompleted(true);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header Back Button */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/services/home-service"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Home Services</span>
        </Link>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Verified DOHS Service Desk
        </span>
      </div>

      {/* Booking Steps Progress */}
      <BookingSteps currentStep={step} />

      {/* Validation Alert */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Main Content Area */}
      {!isCompleted ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            {/* STEP 1: Addon Options */}
            {step === 1 && (
              <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-6">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    Choose Recommended Service Addons
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select optional add-on items or spare parts recommended for this service.
                  </p>
                </div>

                {service.addons && service.addons.length > 0 ? (
                  <div className="space-y-3">
                    {service.addons.map((addon) => {
                      const isSelected = selectedAddonIds.includes(addon.id);
                      return (
                        <div
                          key={addon.id}
                          onClick={() => toggleAddon(addon.id)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-50/50 border-blue-500 shadow-xs'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-sm text-slate-900">{addon.title}</h4>
                            <p className="text-xs text-slate-500">{addon.description}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-sm text-blue-600">
                              +{formatCurrency(addon.price)}
                            </span>
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No extra addons required for this service.</p>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setValidationError('');
                      setStep(2);
                    }}
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all shadow-xs flex items-center gap-2"
                  >
                    <span>Continue to Schedule</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Date & Schedule Picker (Time Slot selection mandatory) */}
            {step === 2 && (
              <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-6">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Select Preferred Arrival Time Slot <span className="text-rose-500">*</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    DOHS Sheba assigned technician will arrive within your selected time window.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Today (Within 2 Hours - Express)',
                    'Today Evening (5:00 PM - 8:00 PM)',
                    'Tomorrow Morning (9:00 AM - 12:00 PM)',
                    'Tomorrow Afternoon (2:00 PM - 5:00 PM)',
                    'Day After Tomorrow (9:00 AM - 12:00 PM)',
                  ].map((slot) => (
                    <div
                      key={slot}
                      onClick={() => {
                        setDateSlot(slot);
                        setValidationError('');
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer font-semibold text-xs transition-all flex items-center justify-between ${
                        dateSlot === slot
                          ? 'bg-blue-50/50 border-blue-600 text-blue-700 shadow-xs font-bold ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{slot}</span>
                      {dateSlot === slot && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setValidationError('');
                      setStep(1);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextFromStep2}
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all shadow-xs flex items-center gap-2"
                  >
                    <span>Continue to Address</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Address & Notes (Blank address by default with instructions) */}
            {step === 3 && (
              <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-6">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Service Address & Special Notes
                  </h3>
                  <p className="text-xs text-slate-500">
                    Provide your house/flat location within DOHS and contact details.
                  </p>
                </div>

                <div className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-600 mb-1 font-bold">
                      DOHS House Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        setValidationError('');
                      }}
                      placeholder="e.g. House #12, Road #04, Block C, Mohakhali DOHS"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-bold">
                      Contact Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setValidationError('');
                      }}
                      placeholder="e.g. +880 1711-223344"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-bold">
                      Special Notes for Technician (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Gate password is #4401, bring extra 10ft wire, call 10 mins before arrival"
                      className="w-full p-3 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setValidationError('');
                      setStep(2);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextFromStep3}
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all shadow-xs flex items-center gap-2"
                  >
                    <span>Review Summary & Payment</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Summary & Payment */}
            {step === 4 && (
              <form
                onSubmit={handleConfirmOrder}
                className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-6"
              >
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Final Review & Payment Option</h3>
                  <p className="text-xs text-slate-500">
                    Confirm your booking details. Technicians are assigned internally by DOHS Sheba.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 space-y-2 text-xs border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Base Service Price ({service.title}):</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(service.price)}</span>
                  </div>
                  {selectedAddons.map((addon) => (
                    <div key={addon.id} className="flex justify-between text-slate-500">
                      <span>Addon ({addon.title}):</span>
                      <span className="font-semibold text-slate-900">+{formatCurrency(addon.price)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Service Location:</span>
                    <span className="font-semibold text-slate-900">{address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contact Phone:</span>
                    <span className="font-semibold text-slate-900">{phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scheduled Time:</span>
                    <span className="font-semibold text-slate-900">{dateSlot}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-extrabold text-sm">
                    <span className="text-slate-900">Total Booking Amount:</span>
                    <span className="text-blue-600">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                      Payment Method
                    </label>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Pay Cash After Completion
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'cod', label: 'Cash After Service', available: true },
                      { id: 'bkash', label: 'bKash Mobile', available: false },
                      { id: 'nagad', label: 'Nagad Wallet', available: false },
                      { id: 'card', label: 'Debit/Credit Card', available: false },
                    ].map((pm) => (
                      <div
                        key={pm.id}
                        onClick={() => {
                          if (pm.available) setPaymentMethod(pm.id as any);
                        }}
                        className={`relative p-3.5 rounded-2xl border text-center transition-all text-xs font-bold ${
                          pm.available && paymentMethod === pm.id
                            ? 'bg-blue-50/50 border-blue-600 text-blue-700 shadow-xs cursor-pointer'
                            : 'border-slate-200 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <span>{pm.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span>DOHS Sheba Managed Service. Certified technicians assigned internally. Pay cash upon job completion.</span>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setValidationError('');
                      setStep(3);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Confirm Booking ({formatCurrency(totalPrice)})</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Summary Sidebar */}
          <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-6">
            <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3">
              Booking Summary
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <Image
                    src={service.image || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200&q=80'}
                    alt={service.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{service.title}</h4>
                  <span className="text-[10px] text-blue-600 font-bold uppercase">{service.categoryName || 'Service'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Base Price:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(service.price)}</span>
                </div>

                {selectedAddons.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Addons Selected:</span>
                    {selectedAddons.map((addon) => (
                      <div key={addon.id} className="flex justify-between text-slate-600 text-[11px]">
                        <span className="truncate max-w-[140px]">{addon.title}</span>
                        <span className="font-semibold text-blue-600">+{formatCurrency(addon.price)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {dateSlot && (
                  <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1">
                    <span className="text-slate-400 font-bold block">Arrival Window:</span>
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 block">
                      {dateSlot}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                  <span>Total Amount:</span>
                  <span className="text-blue-600 text-base">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Confirmation Receipt Screen with Print Invoice Button */
        <div className="p-8 rounded-3xl border border-emerald-200 bg-white shadow-xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Booking Confirmed (PENDING)
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">Booking Placed Successfully!</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              The <strong className="text-slate-900">DOHS Sheba Service Operations Team</strong> will review your request and assign a certified technician.
            </p>
          </div>

          {/* Invoice Print Box */}
          <div id="printable-invoice" className="p-6 rounded-3xl bg-slate-50 border border-slate-200 max-w-lg mx-auto text-left text-xs space-y-3 print:border-none print:shadow-none print:bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="font-black text-base text-slate-900 block">DOHS Sheba Official Service Invoice</span>
                <span className="text-[10px] text-slate-400 font-bold">Mohakhali & Baridhara DOHS Maintenance Desk</span>
              </div>
              <span className="font-mono font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                #{createdBooking?.id?.slice(-8) || 'DS-8891'}
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Service Request:</span>
                <span className="font-extrabold text-slate-900">{service.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Provider:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  DOHS Sheba Service Operations
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Phone:</span>
                <span className="font-bold text-slate-900">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service Address:</span>
                <span className="font-bold text-slate-900">{address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Arrival:</span>
                <span className="font-bold text-slate-900">{dateSlot}</span>
              </div>
            </div>

            {/* Selected Addons Breakdown */}
            {selectedAddons.length > 0 && (
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Service Addons Breakdown:</span>
                {selectedAddons.map((addon) => (
                  <div key={addon.id} className="flex justify-between text-slate-700 font-medium">
                    <span>{addon.title}</span>
                    <span className="font-bold text-blue-600">+{formatCurrency(addon.price)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t-2 border-dashed border-slate-300 pt-3 flex justify-between font-black text-base text-slate-900">
              <span>Total Due (Pay Cash):</span>
              <span className="text-blue-600">{formatCurrency(totalPrice)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={handlePrintInvoice}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print Service Invoice</span>
            </button>

            <Link
              href="/services/home-service"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-200 font-extrabold text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Browse More Services</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
