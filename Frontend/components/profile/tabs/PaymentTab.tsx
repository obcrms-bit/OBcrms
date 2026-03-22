import React from 'react';

interface PaymentTabProps {
  payments?: any[];
}

const PaymentTab: React.FC<PaymentTabProps> = ({ payments = [] }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Payments</h3>
        <button className="px-3 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700">Add Payment</button>
      </div>
      {payments.length === 0 ? (
        <p className="text-sm text-gray-500">No payments recorded for this profile.</p>
      ) : (
        <div className="space-y-3">
          {payments.map((p, idx) => (
            <div key={p._id || idx} className="border border-gray-100 rounded-lg p-3 flex justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">{p.reference || 'Payment'}</p>
                <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</p>
              </div>
              <span className="text-sm font-bold text-green-700">{p.amountCurrency || 'USD'} {p.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentTab;
