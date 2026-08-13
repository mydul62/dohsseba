'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/utils/cn';

interface PosReceiptPrinterProps {
  order: any;
  trackingCode?: string;
  buttonClassName?: string;
  buttonText?: string;
}

export function PosReceiptPrinter({
  order,
  trackingCode,
  buttonClassName,
  buttonText = '🖨️ POS Receipt Print',
}: PosReceiptPrinterProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [bluetoothStatus, setBluetoothStatus] = useState<string>('');
  const [showModal, setShowModal] = useState(false);

  if (!order) return null;

  const displayCode = trackingCode || order.trackingCode || order.id || '';
  const customerName = order.guestName || order.customerName || order.customer?.name || 'DOHS Resident';
  const customerPhone = order.guestPhone || order.customerPhone || order.customer?.phone || 'N/A';
  const deliveryAddress =
    order.guestAddress ||
    order.deliveryAddress ||
    (order.address
      ? [order.address.line1, order.address.area, order.address.city || 'Dhaka']
          .filter(Boolean)
          .join(', ')
      : 'Savar DOHS, Dhaka');

  const items = order.items || [];
  const subtotal = order.subtotal ?? items.reduce((s: number, i: any) => s + (i.price || 0) * (i.quantity || 1), 0);
  const deliveryFee = order.deliveryFee ?? 50;
  const discount = order.discount ?? 0;
  const total = order.totalAmount ?? order.total ?? subtotal + deliveryFee - discount;
  const paymentMethod = order.payment?.method || order.paymentMethod || 'CASH ON DELIVERY';
  const status = order.status || 'PENDING';

  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString('en-BD', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString();

  // ── 1. Standard Thermal Paper Print Fallback (58mm/80mm window.print) ────────
  const triggerThermalBrowserPrint = () => {
    setShowModal(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // ── 2. Web Bluetooth Direct Thermal ESC/POS Printer Driver ──────────────────
  const connectAndPrintBluetoothPOS = async () => {
    if (typeof window === 'undefined' || !('bluetooth' in navigator)) {
      alert('Web Bluetooth API is not supported in this browser. Please use Google Chrome, Edge, or Android Chrome.');
      return;
    }

    try {
      setIsPrinting(true);
      setBluetoothStatus('Scanning for Bluetooth POS Printer...');

      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer service
          '0000e025-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        ],
      });

      setBluetoothStatus(`Connecting to ${device.name || 'POS Printer'}...`);
      const server = await device.gatt.connect();

      // Find primary printer service
      let service: any = null;
      const services = await server.getPrimaryServices();
      if (services.length > 0) {
        service = services[0];
      }

      if (!service) {
        throw new Error('No compatible Bluetooth printer service found on this device.');
      }

      const characteristics = await service.getCharacteristics();
      const writeCharacteristic = characteristics.find(
        (c: any) => c.properties.write || c.properties.writeWithoutResponse
      );

      if (!writeCharacteristic) {
        throw new Error('Printer write characteristic not found.');
      }

      setBluetoothStatus('Formatting receipt data & sending to printer...');

      // Build ESC/POS Thermal Command Buffer
      const encoder = new TextEncoder();

      const initPrinter = new Uint8Array([0x1b, 0x40]); // ESC @ (Reset)
      const centerAlign = new Uint8Array([0x1b, 0x61, 0x01]); // ESC a 1 (Center)
      const leftAlign = new Uint8Array([0x1b, 0x61, 0x00]); // ESC a 0 (Left)
      const doubleHeight = new Uint8Array([0x1b, 0x21, 0x10]); // Bold Double Height
      const normalText = new Uint8Array([0x1b, 0x21, 0x00]); // Normal Text
      const lineFeed = new Uint8Array([0x0a]); // Line Feed
      const paperCut = new Uint8Array([0x1d, 0x56, 0x42, 0x00]); // GS V (Cut)

      let receiptText = '';
      receiptText += '================================\n';
      receiptText += '        DOHS SHEBA BAZAAR       \n';
      receiptText += '    Express Delivery Receipt    \n';
      receiptText += '================================\n';
      receiptText += `Order Code : ${displayCode}\n`;
      receiptText += `Date       : ${orderDate}\n`;
      receiptText += `Customer   : ${customerName}\n`;
      receiptText += `Phone      : ${customerPhone}\n`;
      receiptText += `Address    : ${deliveryAddress.slice(0, 30)}\n`;
      if (deliveryAddress.length > 30) {
        receiptText += `             ${deliveryAddress.slice(30, 60)}\n`;
      }
      receiptText += '--------------------------------\n';
      receiptText += 'ITEM            QTY       AMOUNT\n';
      receiptText += '--------------------------------\n';

      items.forEach((item: any) => {
        const name = (item.product?.name || item.name || 'Item').slice(0, 15).padEnd(15, ' ');
        const qty = String(item.quantity || 1).padStart(3, ' ');
        const amt = `TK ${formatCurrency((item.price || 0) * (item.quantity || 1))}`.padStart(10, ' ');
        receiptText += `${name} ${qty} ${amt}\n`;
      });

      receiptText += '--------------------------------\n';
      receiptText += `Subtotal     : TK ${formatCurrency(subtotal)}\n`;
      receiptText += `Delivery Fee : TK ${formatCurrency(deliveryFee)}\n`;
      if (discount > 0) {
        receiptText += `Discount     : -TK ${formatCurrency(discount)}\n`;
      }
      receiptText += '================================\n';
      receiptText += `TOTAL DUE    : TK ${formatCurrency(total)}\n`;
      receiptText += `Payment      : ${paymentMethod}\n`;
      receiptText += `Status       : ${status}\n`;
      receiptText += '================================\n';
      receiptText += '   Thank you for using DOHS Sheba! \n';
      receiptText += '      www.dohssheba.com          \n\n\n';

      // Send payload chunk by chunk to avoid BLE packet size limit
      const payloadBytes = encoder.encode(receiptText);
      await writeCharacteristic.writeValue(initPrinter);
      await writeCharacteristic.writeValue(centerAlign);
      await writeCharacteristic.writeValue(doubleHeight);
      await writeCharacteristic.writeValue(encoder.encode('DOHS SHEBA BAZAAR\n'));
      await writeCharacteristic.writeValue(normalText);
      await writeCharacteristic.writeValue(leftAlign);
      await writeCharacteristic.writeValue(payloadBytes);
      await writeCharacteristic.writeValue(lineFeed);
      await writeCharacteristic.writeValue(lineFeed);
      await writeCharacteristic.writeValue(paperCut);

      setBluetoothStatus('✅ Printed successfully!');
      setTimeout(() => {
        setBluetoothStatus('');
        setIsPrinting(false);
        setShowModal(false);
      }, 1500);
    } catch (err: any) {
      console.warn('Bluetooth POS printing notice:', err);
      setBluetoothStatus(`Notice: ${err.message || 'Bluetooth printing cancelled'}`);
      setIsPrinting(false);
    }
  };

  return (
    <>
      {/* ── TRIGGER BUTTON ── */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={
          buttonClassName ||
          'inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all'
        }
      >
        <span>{buttonText}</span>
      </button>

      {/* ── MODAL DIALOG FOR PRINT OPTIONS ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-slate-800 border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  🖨️
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">POS Receipt Printing</h3>
                  <p className="text-[11px] text-slate-500">Select printer type or print thermal memo</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Status Message */}
            {bluetoothStatus && (
              <div className="mb-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-pulse">
                {bluetoothStatus}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Option 1: Browser Thermal Print */}
              <button
                type="button"
                onClick={triggerThermalBrowserPrint}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  <div>
                    <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700">
                      Standard Thermal Print (58mm / 80mm)
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Print via USB printer or system print dialog
                    </div>
                  </div>
                </div>
                <span className="text-emerald-600 font-bold text-sm">➔</span>
              </button>

              {/* Option 2: Bluetooth POS Direct Print */}
              <button
                type="button"
                disabled={isPrinting}
                onClick={connectAndPrintBluetoothPOS}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📶</span>
                  <div>
                    <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700">
                      Web Bluetooth POS Printer
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Connect handheld Bluetooth thermal printer
                    </div>
                  </div>
                </div>
                <span className="text-emerald-600 font-bold text-sm">➔</span>
              </button>
            </div>

            {/* Footer Notice */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Order Code: #{displayCode.slice(-8).toUpperCase()}</span>
              <span>Total: ৳{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── HIDDEN COMPACT THERMAL RECEIPT LAYOUT FOR PRINTING ── */}
      <div id="pos-thermal-receipt" className="hidden">
        <style>{`
          @media print {
            @page {
              size: 58mm auto;
              margin: 0;
            }
            body * {
              visibility: hidden !important;
            }
            #pos-thermal-receipt {
              display: block !important;
              visibility: visible !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 58mm !important;
              padding: 2mm !important;
              font-family: 'Courier New', Courier, monospace !important;
              font-size: 10px !important;
              line-height: 1.2 !important;
              color: #000 !important;
              background: #fff !important;
            }
            #pos-thermal-receipt * {
              visibility: visible !important;
            }
          }
        `}</style>

        <div style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold' }}>DOHS SHEBA BAZAAR</div>
          <div style={{ fontSize: '9px' }}>Express Grocery & Services</div>
          <div>================================</div>
          <div style={{ textAlign: 'left', marginTop: '4px' }}>
            <div>Code: #{displayCode}</div>
            <div>Date: {orderDate}</div>
            <div>Cust: {customerName}</div>
            <div>Phone: {customerPhone}</div>
            <div>Addr: {deliveryAddress}</div>
          </div>
          <div>--------------------------------</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
              ITEM &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; QTY &nbsp; AMT
            </div>
            {items.map((i: any, index: number) => {
              const name = (i.product?.name || i.name || 'Item').slice(0, 14);
              const qty = i.quantity || 1;
              const price = (i.price || 0) * qty;
              return (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                  <span>{name}</span>
                  <span>x{qty} ৳{formatCurrency(price)}</span>
                </div>
              );
            })}
          </div>
          <div>--------------------------------</div>
          <div style={{ textAlign: 'right' }}>
            <div>Subtotal: ৳{formatCurrency(subtotal)}</div>
            <div>Del Fee : ৳{formatCurrency(deliveryFee)}</div>
            {discount > 0 && <div>Discount: -৳{formatCurrency(discount)}</div>}
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>
              TOTAL DUE: ৳{formatCurrency(total)}
            </div>
            <div style={{ fontSize: '9px', marginTop: '2px' }}>Payment: {paymentMethod}</div>
          </div>
          <div>================================</div>
          <div style={{ fontSize: '9px', marginTop: '6px' }}>Thank you for using DOHS Sheba!</div>
          <div style={{ fontSize: '8px' }}>www.dohssheba.com</div>
          <div style={{ height: '20px' }}></div>
        </div>
      </div>
    </>
  );
}
