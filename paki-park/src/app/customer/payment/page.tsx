'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, CreditCard, Plus, Trash2, CheckCircle, Star, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { bookingService } from '@/services/bookingService';

const LOGO_SRC = '/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';

export default function PaymentPage() {
  const router = useRouter();
  const [showAddCard, setShowAddCard] = useState(false);

  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    // Fetch real bookings to populate recent transactions and stats
    bookingService.getMyBookings({ page: 1 })
      .then(data => {
        const bookings = data.bookings || [];
        setRecentTransactions(bookings.slice(0, 5));
        
        // Calculate total spent from completed bookings this month
        const thisMonth = new Date().getMonth();
        const spent = bookings
          .filter(b => b.status === 'completed' && new Date(b.date).getMonth() === thisMonth)
          .reduce((acc, curr) => acc + (curr.amount || 0), 0);
        
        setTotalSpent(spent);
      })
      .catch(() => {});
  }, []);

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
      toast.error('Please fill in all card details');
      return;
    }

    toast.loading('Adding payment method...');
    setTimeout(() => {
      toast.dismiss();
      toast.success('Payment method added successfully!');
      
      const newMethod = {
        id: Date.now().toString(),
        type: 'card',
        brand: cardData.number.startsWith('4') ? 'Visa' : 'Mastercard',
        last4: cardData.number.slice(-4),
        expiry: cardData.expiry,
        isDefault: paymentMethods.length === 0,
        holderName: cardData.name,
      };
      
      setPaymentMethods([...paymentMethods, newMethod]);
      setCardData({ number: '', name: '', expiry: '', cvv: '' });
      setShowAddCard(false);
    }, 1500);
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(method => ({ ...method, isDefault: method.id === id }))
    );
    toast.success('Default payment method updated!');
  };

  const handleDeleteMethod = (id: string) => {
    const method = paymentMethods.find(m => m.id === id);
    if (method?.isDefault && paymentMethods.length > 1) {
      toast.error('Cannot delete default payment method. Set another as default first.');
      return;
    }
    setPaymentMethods(methods => methods.filter(m => m.id !== id));
    toast.success('Payment method removed!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/customer/home')} className="gap-2 text-gray-500 hover:text-[#1e3d5a]">
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Image src={LOGO_SRC} alt="PakiPark" width={100} height={32} className="h-8 w-auto object-contain" unoptimized />
            </div>
            <h1 className="text-xl font-bold text-[#1e3d5a]">Payment Methods</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Payment Methods Section */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#1e3d5a]">Payment Methods</h2>
                  <Button onClick={() => setShowAddCard(!showAddCard)} className="bg-[#ee6b20] hover:bg-[#d95a10] gap-2 rounded-xl">
                    <Plus className="size-4" /> Add New
                  </Button>
                </div>
              </div>

              {showAddCard && (
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                  <form onSubmit={handleAddCard} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                      <Input type="text" placeholder="1234 5678 9012 3456" value={cardData.number} onChange={(e) => setCardData({ ...cardData, number: e.target.value.replace(/\D/g, '') })} maxLength={16} className="bg-white border-gray-200" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                      <Input type="text" placeholder="Juan Dela Cruz" value={cardData.name} onChange={(e) => setCardData({ ...cardData, name: e.target.value })} className="bg-white border-gray-200" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                        <Input type="text" placeholder="MM/YY" value={cardData.expiry} onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })} maxLength={5} className="bg-white border-gray-200" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                        <Input type="text" placeholder="123" value={cardData.cvv} onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })} maxLength={4} className="bg-white border-gray-200" required />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-2">
                      <Button type="button" variant="outline" onClick={() => setShowAddCard(false)} className="flex-1 rounded-xl">Cancel</Button>
                      <Button type="submit" className="flex-1 bg-[#ee6b20] hover:bg-[#d95a10] rounded-xl font-bold">Add Card</Button>
                    </div>
                  </form>
                </div>
              )}

              <div className="p-6 space-y-4">
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                      <CreditCard className="size-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-[#1e3d5a] mb-1">No payment methods</h3>
                    <p className="text-sm text-gray-400 font-medium mb-6">Add a payment method to streamline your bookings</p>
                    <Button onClick={() => setShowAddCard(true)} variant="outline" className="text-[#ee6b20] border-[#ee6b20]/30 hover:bg-orange-50 font-bold rounded-xl">
                      <Plus className="size-4 mr-2" /> Add Payment Method
                    </Button>
                  </div>
                ) : (
                  paymentMethods.map((method) => (
                    <div key={method.id} className={`p-4 border-2 rounded-xl transition-all flex items-center justify-between ${method.isDefault ? 'border-[#ee6b20] bg-orange-50/30' : 'border-gray-100'}`}>
                      <div className="flex items-center gap-4">
                        <div className="size-12 bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                          <CreditCard className="size-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-bold text-[#1e3d5a]">
                              {method.brand} •••• {method.last4}
                            </p>
                            {method.isDefault && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#ee6b20] text-white">
                                <Star className="size-3 fill-current" /> Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-medium">{method.holderName}  •  Expires {method.expiry}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!method.isDefault && (
                          <Button onClick={() => handleSetDefault(method.id)} variant="outline" size="sm" className="text-xs rounded-lg font-bold text-gray-500">
                            Set Default
                          </Button>
                        )}
                        <Button onClick={() => handleDeleteMethod(method.id)} variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-[#1e3d5a]">Recent Transactions</h2>
              </div>
              <div className="p-6">
                {recentTransactions.length === 0 ? (
                  <p className="text-center text-gray-400 font-medium py-6">No recent transactions to show.</p>
                ) : (
                  <div className="space-y-4">
                    {recentTransactions.map((transaction) => (
                      <div key={transaction._id} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:border-gray-300 transition-colors bg-gray-50/50">
                        <div>
                          <p className="font-bold text-[#1e3d5a] mb-1">{transaction.locationName}</p>
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                            <span className="flex items-center gap-1"><Calendar className="size-3.5" />{transaction.date}</span>
                            <span>•</span>
                            <span>{transaction.timeSlot}</span>
                            <span>•</span>
                            <span className="text-gray-400">{transaction.paymentMethod}</span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <p className="text-lg font-black text-[#1e3d5a]">₱{transaction.amount?.toFixed(2)}</p>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-700' : 
                            transaction.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {transaction.status === 'completed' && <CheckCircle className="size-3" />}
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            
            {/* Spending Summary */}
            <div className="bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ee6b20]/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
              <div className="relative z-10">
                <h3 className="font-black text-sm uppercase tracking-wider text-white/80 mb-4">This Month</h3>
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-bold text-white/60 mb-0.5">Total Spent</p>
                    <p className="text-4xl font-black">₱{totalSpent.toFixed(2)}</p>
                  </div>
                  <div className="pt-5 border-t border-white/20">
                    <p className="text-xs font-bold text-white/80 mb-3">Breakdown</p>
                    <div className="space-y-2 text-sm font-medium">
                      <div className="flex justify-between items-center"><span className="text-white/70">Parking Fees</span><span className="font-bold">₱{totalSpent.toFixed(2)}</span></div>
                      <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/10"><span className="text-white/70">App Transactions</span><span className="font-bold">{recentTransactions.filter(r => r.status === 'completed').length}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-black text-[#1e3d5a] mb-5">Payment Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <span className="text-sm font-bold text-gray-500">Saved Methods</span>
                  <span className="text-xl font-black text-[#ee6b20]">{paymentMethods.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-500">Success Rate</span>
                  <span className="text-xl font-black text-green-500">100%</span>
                </div>
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100 text-blue-500">
                  <CheckCircle className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#1e3d5a] mb-1">Bank-Grade Security</p>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    Your transactions are 256-bit SSL encrypted. Payment details are directly processed by the provider and never stored on our servers.
                  </p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}