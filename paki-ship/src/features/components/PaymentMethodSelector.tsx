import React, { useMemo, useState, useEffect } from "react";
import {
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  ShieldCheck,
  AlertCircle,
  Save,
  Loader2,
  ChevronRight,
  ChevronDown,
  Building2,
  Lock,
  User,
  Users,
  X,
} from "lucide-react";
import {
  fetchSavedRecipients,
  quickSaveRecipient,
  type SavedRecipient,
} from "@/lib/customer-profile";
const gcashLogo = "/assets/6557a9da1a0207c1bccde05ffcf445d04ba3d099.png";
const mayaLogo = "/assets/255b60762629fecd2f88e79db44bd4b5835e1c02.png";

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onSelect: (method: string) => void;
  codPayer?: "sender" | "receiver" | null;
  onSelectCodPayer: (payer: "sender" | "receiver" | null) => void;
  selectedServiceId: string;
  receiverName: string;
  receiverPhone: string;
  onReceiverChange: (data: { name: string; phone: string }) => void;
}

const normalizePhone = (raw: string = "") => raw.replace(/\s+/g, "").trim();
const isLikelyPHMobile = (phone: string = "") => /^09\d{9}$/.test(phone);

export default function PaymentMethodSelector({
  selectedMethod,
  onSelect,
  codPayer = null,
  onSelectCodPayer,
  selectedServiceId,
  receiverName,
  receiverPhone,
  onReceiverChange,
}: PaymentMethodSelectorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showCodPayerModal, setShowCodPayerModal] = useState(false);

  // LOGIC DEFINITIONS
  const isCashAllowed = selectedServiceId !== "pakishare";
  const isDigitalAllowed = true; 

  const [contacts, setContacts] = useState<SavedRecipient[]>([]);

  const normalizedReceiverPhone = useMemo(() => normalizePhone(receiverPhone), [receiverPhone]);
  const matchedContact = useMemo(() => contacts.find((c) => normalizePhone(c.phone) === normalizedReceiverPhone) || null, [contacts, normalizedReceiverPhone]);
  const isAlreadySaved = !!matchedContact;

  useEffect(() => {
    let isMounted = true;

    const loadSavedRecipients = async () => {
      try {
        const result = await fetchSavedRecipients();
        if (isMounted) {
          setContacts(result.recipients);
        }
      } catch {
        if (isMounted) {
          setContacts([]);
        }
      }
    };

    void loadSavedRecipients();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setHasSaved(false);
    setSaveError(null);
  }, [receiverName, normalizedReceiverPhone]);

  // AUTO-CORRECTION LOGIC
  useEffect(() => {
    if (!isCashAllowed && selectedMethod === 'cash') {
      onSelect('gcash');
      onSelectCodPayer(null);
      setExpandedSection('ewallet');
    }
  }, [selectedServiceId, selectedMethod, onSelect, onSelectCodPayer, isCashAllowed]);

  useEffect(() => {
    if (selectedMethod !== "cash" && codPayer) {
      onSelectCodPayer(null);
    }
  }, [selectedMethod, codPayer, onSelectCodPayer]);

  const handleContactSelect = (contact: SavedRecipient) => {
    // This strictly updates the input fields/state and does not trigger modal navigation
    onReceiverChange({ 
      name: contact.name, 
      phone: contact.phone 
    });
    
    setContacts((prev) => 
      prev.map(c => c.id === contact.id 
        ? { ...c, frequency: c.frequency + 1, lastUsed: new Date().toISOString() } 
        : c
      )
    );
  };

  const bankOptions = [
    { id: "bdo", name: "BDO Unibank" },
    { id: "bpi", name: "BPI" },
    { id: "metrobank", name: "Metrobank" },
  ];

  const handleSaveContact = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSaving || hasSaved || isAlreadySaved || !receiverName.trim() || !isLikelyPHMobile(normalizedReceiverPhone)) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await quickSaveRecipient({
        name: receiverName.trim(),
        phone: normalizedReceiverPhone,
      });

      setContacts((prev) => {
        const withoutDuplicate = prev.filter(
          (contact) => normalizePhone(contact.phone) !== normalizePhone(result.recipient.phone),
        );
        return [result.recipient, ...withoutDuplicate];
      });
      setIsSaving(false);
      setHasSaved(true);
      setTimeout(() => setHasSaved(false), 2500);
    } catch (error) {
      setIsSaving(false);
      setSaveError(
        error instanceof Error ? error.message : "Unable to save this recipient.",
      );
    }
  };

  const handleSelectCash = () => {
    setExpandedSection(null);
    setShowCodPayerModal(true);
  };

  const handleConfirmCodPayer = (payer: "sender" | "receiver") => {
    onSelect("cash");
    onSelectCodPayer(payer);
    setShowCodPayerModal(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 antialiased p-4">
      {/* SECTION 1: CONTACT SELECTION */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <div className="h-px flex-1 bg-slate-100" />
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Frequent Recipients</span>
          <div className="h-px flex-1 bg-slate-100" />
        </div>
        <div className="flex gap-3 overflow-x-auto py-2 px-1 scrollbar-hide">
          {[...contacts].sort((a, b) => b.frequency - a.frequency).map((contact) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => handleContactSelect(contact)}
              className={`flex-shrink-0 flex items-center gap-3 pl-2 pr-5 py-2 rounded-full border-2 transition-all ${
                normalizedReceiverPhone === normalizePhone(contact.phone) 
                ? "bg-[#39B5A8] border-[#39B5A8] text-white" 
                : "bg-white border-slate-100"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${normalizedReceiverPhone === normalizePhone(contact.phone) ? "bg-white text-[#39B5A8]" : "bg-slate-100 text-slate-500"}`}>{contact.initial}</div>
              <div className="text-left">
                <p className="text-xs font-bold">{contact.name}</p>
                <p className="text-[10px] opacity-80">{contact.phone}</p>
              </div>
            </button>
          ))}
        </div>
        
        {receiverName && (
          <div className="bg-slate-50/80 border border-slate-100 rounded-[2rem] p-5 flex items-center justify-between gap-4 flex-col sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hasSaved || isAlreadySaved ? "bg-[#39B5A8] text-white" : "bg-white text-slate-400 shadow-sm"}`}>
                {hasSaved || isAlreadySaved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">{isAlreadySaved ? "Contact Verified" : "Save recipient?"}</h4>
                <p className="text-[10px] text-slate-500">Quickly use this contact for future shipments.</p>
                {saveError && (
                  <p className="mt-1 text-[10px] font-semibold text-red-500">{saveError}</p>
                )}
              </div>
            </div>
            {!isAlreadySaved && (
              <button 
                type="button"
                onClick={handleSaveContact} 
                disabled={isSaving || !isLikelyPHMobile(normalizedReceiverPhone)} 
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : hasSaved ? "Saved!" : "Quick Save"}
              </button>
            )}
          </div>
        )}
      </section>

      {/* SECTION 2: PAYMENT METHOD */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#39B5A8]/10 rounded-lg"><CreditCard className="w-5 h-5 text-[#39B5A8]" /></div>
            <h3 className="text-lg font-bold text-slate-900">Payment Method</h3>
          </div>
          {!isCashAllowed && (
            <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1 ml-1">
              <ShieldCheck className="w-3 h-3" /> Digital payment required for this service
            </p>
          )}
        </div>

        <div className="space-y-3">
          {/* E-WALLET DROPDOWN */}
          <div className={`border-2 rounded-[1.5rem] transition-all overflow-hidden ${!isDigitalAllowed ? 'opacity-40 grayscale bg-slate-50 border-slate-100 pointer-events-none' : expandedSection === 'ewallet' ? 'border-[#39B5A8]' : 'border-slate-100'}`}>
            <button 
              type="button"
              disabled={!isDigitalAllowed}
              onClick={() => setExpandedSection(expandedSection === 'ewallet' ? null : 'ewallet')}
              className="w-full p-5 flex items-center justify-between bg-transparent outline-none focus:outline-none"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                  {!isDigitalAllowed ? <Lock className="w-6 h-6 text-slate-400" /> : <Smartphone className="w-6 h-6" />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800">E-Wallet</p>
                  <p className="text-xs text-slate-400">GCash or Maya</p>
                </div>
              </div>
              {isDigitalAllowed && (expandedSection === 'ewallet' ? <ChevronDown className="w-5 h-5 text-[#39B5A8]" /> : <ChevronRight className="w-5 h-5 text-slate-300" />)}
            </button>
            
            {isDigitalAllowed && expandedSection === 'ewallet' && (
              <div className="p-2 bg-slate-50 flex flex-col gap-2">
                {['gcash', 'paymaya'].map((wallet) => (
                  <button 
                    key={wallet}
                    type="button"
                    onClick={() => onSelect(wallet)}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all ${selectedMethod === wallet ? 'bg-white shadow-sm ring-1 ring-[#39B5A8]/30' : 'hover:bg-slate-100'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                        <img 
                          src={wallet === 'gcash' ? gcashLogo : mayaLogo} 
                          alt={wallet === 'gcash' ? 'GCash' : 'Maya'} 
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700 capitalize">{wallet === 'paymaya' ? 'Maya' : 'GCash'}</span>
                    </div>
                    {selectedMethod === wallet && <CheckCircle className="w-4 h-4 text-[#39B5A8]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* BANK ACCOUNT DROPDOWN */}
          <div className={`border-2 rounded-[1.5rem] transition-all overflow-hidden ${!isDigitalAllowed ? 'opacity-40 grayscale bg-slate-50 border-slate-100 pointer-events-none' : expandedSection === 'bank' ? 'border-[#39B5A8]' : 'border-slate-100'}`}>
            <button 
              type="button"
              disabled={!isDigitalAllowed}
              onClick={() => setExpandedSection(expandedSection === 'bank' ? null : 'bank')}
              className="w-full p-5 flex items-center justify-between bg-transparent outline-none focus:outline-none"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl">
                  {!isDigitalAllowed ? <Lock className="w-6 h-6 text-slate-400" /> : <Building2 className="w-6 h-6" />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800">Bank Transfer</p>
                  <p className="text-xs text-slate-400">Direct secure bank payment</p>
                </div>
              </div>
              {isDigitalAllowed && (expandedSection === 'bank' ? <ChevronDown className="w-5 h-5 text-[#39B5A8]" /> : <ChevronRight className="w-5 h-5 text-slate-300" />)}
            </button>
            
            {isDigitalAllowed && expandedSection === 'bank' && (
              <div className="p-2 bg-slate-50 grid grid-cols-1 gap-1">
                {bankOptions.map((bank) => (
                  <button 
                    key={bank.id}
                    type="button"
                    onClick={() => onSelect(bank.id)}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all ${selectedMethod === bank.id ? 'bg-white shadow-sm ring-1 ring-[#39B5A8]/30' : 'hover:bg-slate-100'}`}
                  >
                    <span className="text-sm font-medium text-slate-700">{bank.name}</span>
                    {selectedMethod === bank.id && <CheckCircle className="w-4 h-4 text-[#39B5A8]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CASH OPTION */}
          <div className={`border-2 rounded-[1.5rem] transition-all overflow-hidden ${
            !isCashAllowed 
              ? 'opacity-40 grayscale bg-slate-50 border-slate-100 pointer-events-none select-none' 
              : selectedMethod === 'cash' 
                ? 'border-[#39B5A8] bg-white' 
                : 'border-slate-100 hover:border-slate-200'
          }`}>
            <button 
              type="button"
              disabled={!isCashAllowed}
              onClick={handleSelectCash}
              className="w-full p-5 flex items-center justify-between bg-transparent outline-none focus:outline-none"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${!isCashAllowed ? 'bg-slate-200 text-slate-400' : 'bg-emerald-50 text-emerald-500'}`}>
                  {!isCashAllowed ? <Lock className="w-6 h-6" /> : <Banknote className="w-6 h-6" />}
                </div>
                <div className="text-left">
                  <p className={`text-sm font-bold ${!isCashAllowed ? 'text-slate-400' : 'text-slate-800'}`}>Cash on Delivery</p>
                  <p className={`text-xs ${!isCashAllowed ? 'text-slate-400' : 'text-slate-400'}`}>
                    {isCashAllowed
                      ? codPayer
                        ? `Paid by ${codPayer === "sender" ? "Sender" : "Receiver"}`
                        : 'Pay upon arrival'
                      : 'Unavailable for this service'}
                  </p>
                </div>
              </div>
              {selectedMethod === 'cash' && isCashAllowed && <CheckCircle className="w-5 h-5 text-[#39B5A8]" />}
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER SECURITY */}
      <div className="relative overflow-hidden rounded-[2rem] border border-[#39B5A8]/20 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#39B5A8]/10 text-[#39B5A8]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-slate-800">PakiShip SecurePay™</h4>
              <span className="bg-[#39B5A8]/10 px-2 py-0.5 text-[8px] font-bold uppercase text-[#39B5A8] rounded">Encrypted</span>
            </div>
            <p className="text-[10px] text-slate-500">Your payment information is handled via high-level SSL encryption.</p>
          </div>
        </div>
      </div>

      {showCodPayerModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close COD payer modal"
            className="absolute inset-0 bg-[#041614]/55 backdrop-blur-sm"
            onClick={() => setShowCodPayerModal(false)}
          />
          <div className="relative w-full max-w-md rounded-[2rem] border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#39B5A8]">
                  Cash on Delivery
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  Who will pay?
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Choose who will hand over the cash once the parcel is delivered.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCodPayerModal(false)}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleConfirmCodPayer("sender")}
                className={`flex w-full items-center justify-between rounded-[1.5rem] border-2 p-4 text-left transition-all ${
                  codPayer === "sender"
                    ? "border-[#39B5A8] bg-[#F0F9F8]"
                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Sender</p>
                    <p className="text-xs text-slate-500">Pickup-side customer pays the COD amount</p>
                  </div>
                </div>
                {codPayer === "sender" && <CheckCircle className="h-5 w-5 text-[#39B5A8]" />}
              </button>

              <button
                type="button"
                onClick={() => handleConfirmCodPayer("receiver")}
                className={`flex w-full items-center justify-between rounded-[1.5rem] border-2 p-4 text-left transition-all ${
                  codPayer === "receiver"
                    ? "border-[#39B5A8] bg-[#F0F9F8]"
                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-sky-50 p-3 text-sky-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Receiver</p>
                    <p className="text-xs text-slate-500">Destination-side customer pays the COD amount</p>
                  </div>
                </div>
                {codPayer === "receiver" && <CheckCircle className="h-5 w-5 text-[#39B5A8]" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
