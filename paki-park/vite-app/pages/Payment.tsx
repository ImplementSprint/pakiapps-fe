import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, CreditCard, Plus, Trash2, CheckCircle, Star, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import logo from '../../assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';

export function Payment() {
  const navigate = useNavigate();
  const [showAddCard, setShowAddCard] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: '1',
      type: 'card',
      brand: 'Visa',
      last4: '4242',
      expiry: '12/26',
      isDefault: true,
      holderName: 'Juan Dela Cruz',
    },
    {
      id: '2',
      type: 'card',
      brand: 'Mastercard',
      last4: '8888',
      expiry: '03/27',
      isDefault: false,
      holderName: 'Juan Dela Cruz',
    },
    {
      id: '3',
      type: 'gcash',
      phoneNumber: '+63 912 345 6789',
      isDefault: false,
    },
  ]);

  const recentTransactions = [
    {
      id: '1',
      location: 'SM City Mall',
      amount: 200,
      date: '2026-02-18',
      time: '10:30 AM',
      status: 'completed',
      method: 'Visa ****4242',
    },
    {
      id: '2',
      location: 'Ayala Center',
      amount: 150,
      date: '2026-02-15',
      time: '3:45 PM',
      status: 'completed',
      method: 'GCash',
    },
    {
      id: '3',
      location: 'Robinson\'s Place',
      amount: 180,
      date: '2026-02-12',
      time: '11:20 AM',
      status: 'completed',
      method: 'Mastercard ****8888',
    },
  ];

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
      methods.map(method => ({
        ...method,
        isDefault: method.id === id,
      }))
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/customer/home')}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <img src={logo} alt="PakiPark" className="h-8" />
            </div>
            <h1 className="text-xl font-bold text-[#1e3d5a]">Payment Methods</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Payment Methods Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add New Payment Method */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#1e3d5a]">Payment Methods</h2>
                  <Button
                    onClick={() => setShowAddCard(!showAddCard)}
                    className="bg-[#ee6b20] hover:bg-[#ee6b20]/90 gap-2"
                  >
                    <Plus className="size-4" />
                    Add New
                  </Button>
                </div>
              </div>

              {showAddCard && (
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                  <form onSubmit={handleAddCard} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number
                      </label>
                      <Input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardData.number}
                        onChange={(e) => setCardData({ ...cardData, number: e.target.value.replace(/\s/g, '') })}
                        maxLength={16}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cardholder Name
                      </label>
                      <Input
                        type="text"
                        placeholder="Juan Dela Cruz"
                        value={cardData.name}
                        onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry Date
                        </label>
                        <Input
                          type="text"
                          placeholder="MM/YY"
                          value={cardData.expiry}
                          onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV
                        </label>
                        <Input
                          type="text"
                          placeholder="123"
                          value={cardData.cvv}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                          maxLength={3}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddCard(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="flex-1 bg-[#ee6b20] hover:bg-[#ee6b20]/90">
                        Add Card
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              <div className="p-6 space-y-4">
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="size-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="size-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No payment methods</h3>
                    <p className="text-gray-600 mb-6">Add a payment method to start booking</p>
                    <Button
                      onClick={() => setShowAddCard(true)}
                      className="bg-[#ee6b20] hover:bg-[#ee6b20]/90"
                    >
                      <Plus className="size-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </div>
                ) : (
                  paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        method.isDefault
                          ? 'border-[#ee6b20] bg-[#ee6b20]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="size-12 bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-lg flex items-center justify-center flex-shrink-0">
                            <CreditCard className="size-6 text-white" />
                          </div>
                          <div>
                            {method.type === 'card' ? (
                              <>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-bold text-[#1e3d5a]">
                                    {method.brand} •••• {method.last4}
                                  </p>
                                  {method.isDefault && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                      <Star className="size-3 fill-current" />
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{method.holderName}</p>
                                <p className="text-sm text-gray-500">Expires {method.expiry}</p>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-bold text-[#1e3d5a]">GCash</p>
                                  {method.isDefault && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                      <Star className="size-3 fill-current" />
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{method.phoneNumber}</p>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!method.isDefault && (
                            <Button
                              onClick={() => handleSetDefault(method.id)}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              Set Default
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDeleteMethod(method.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-[#1e3d5a]">Recent Transactions</h2>
              </div>
              <div className="p-6 space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-[#1e3d5a] mb-1">{transaction.location}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-4" />
                          {transaction.date}
                        </span>
                        <span>{transaction.time}</span>
                        <span className="text-gray-400">•</span>
                        <span>{transaction.method}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#1e3d5a]">₱{transaction.amount}</p>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        <CheckCircle className="size-3" />
                        Paid
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Spending Summary */}
            <div className="bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-xl shadow-lg p-6 text-white">
              <h3 className="font-bold mb-4">This Month</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm opacity-80">Total Spent</p>
                  <p className="text-3xl font-bold">₱530</p>
                </div>
                <div className="pt-4 border-t border-white/20">
                  <p className="text-sm opacity-80 mb-2">Breakdown</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="opacity-80">Parking Fees</span>
                      <span className="font-semibold">₱530</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-80">Transactions</span>
                      <span className="font-semibold">3</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-[#1e3d5a] mb-4">Payment Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Methods</span>
                  <span className="text-xl font-bold text-[#1e3d5a]">{paymentMethods.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Transactions</span>
                  <span className="text-xl font-bold text-[#1e3d5a]">{recentTransactions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <span className="text-xl font-bold text-green-600">100%</span>
                </div>
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Secure Payments
                  </p>
                  <p className="text-xs text-blue-800">
                    Your payment information is encrypted and secure. We never store your full card details.
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
