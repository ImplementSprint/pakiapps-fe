import { useNavigate } from 'react-router';
import { ChevronLeft, FileText } from 'lucide-react';
import logo from '../../assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';

export function TermsOfUse() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f4f7fa]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="size-5 text-[#1e3d5a]" />
          </button>
          <img src={logo} alt="PakiPark" className="h-8 object-contain cursor-pointer" onClick={() => navigate('/')} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="size-14 bg-[#ee6b20] rounded-2xl flex items-center justify-center">
              <FileText className="size-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#1e3d5a]">Terms of Use</h1>
              <p className="text-gray-500 text-sm">Last updated: March 12, 2026</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none space-y-8 text-gray-700">
            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing or using PakiPark (the "Platform"), you agree to be bound by these Terms of Use ("Terms"). If you do not agree to all of these Terms, you may not access or use the Platform. These Terms constitute a legally binding agreement between you and PakiPark Inc. ("PakiPark," "we," "our," or "us").
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">2. Description of Services</h2>
              <p className="leading-relaxed">
                PakiPark provides a smart parking reservation platform that allows users to search, reserve, and pay for parking spaces at participating locations across the Philippines. Our services include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>Real-time parking availability and slot reservation (1-hour time slots).</li>
                <li>Secure payment processing through GCash, Maya, and credit/debit cards.</li>
                <li>Digital E-Pass generation with barcode for parking access.</li>
                <li>Vehicle management and booking history tracking.</li>
                <li>Business Partner portal for parking facility owners and operators.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">3. User Accounts</h2>
              <p className="leading-relaxed mb-3">To use PakiPark, you must:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Be at least 18 years of age or the legal age of majority in your jurisdiction.</li>
                <li>Provide accurate, complete, and up-to-date registration information.</li>
                <li>Maintain the security and confidentiality of your account credentials.</li>
                <li>Immediately notify us of any unauthorized use of your account.</li>
              </ul>
              <p className="leading-relaxed mt-3">
                You are responsible for all activity that occurs under your account. PakiPark reserves the right to suspend or terminate accounts that violate these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">4. Business Partner Accounts</h2>
              <p className="leading-relaxed">
                Business Partners (parking facility operators) must provide valid business documentation including a current Business Permit, DTI/SEC Registration, and proof of facility ownership or lease. Applications are subject to verification and approval. Business Partners must comply with all applicable local government regulations, DPWH standards, and safety requirements. PakiPark reserves the right to deny or revoke Business Partner status at its sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">5. Reservations and Bookings</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Time Slots:</strong> All reservations are for 1-hour time slots. You may arrive at any point within your reserved hour.</li>
                <li><strong>No-Show Policy:</strong> If you fail to arrive within your reserved time slot, the reservation will be automatically voided. Repeated no-shows may result in account restrictions or penalties.</li>
                <li><strong>Extended Stay:</strong> If you stay beyond your reserved hour, additional charges of the location's hourly rate will apply based on actual time used.</li>
                <li><strong>Spot Assignment:</strong> Parking spot assignments are subject to availability and may be auto-assigned by the system.</li>
                <li><strong>Confirmation:</strong> A booking is only confirmed once payment is successfully processed and a booking reference number is generated.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">6. Payments and Refunds</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>All prices are displayed in Philippine Pesos (PHP) and include applicable taxes.</li>
                <li>Payment is required at the time of booking through our accepted payment methods.</li>
                <li>Processing fees may apply depending on the payment method used.</li>
                <li><strong>Cancellations:</strong> You may cancel a booking before the start of your reserved time slot. Cancellations made at least 30 minutes before the slot start time are eligible for a full refund. Late cancellations may be subject to a cancellation fee.</li>
                <li><strong>Refunds:</strong> Approved refunds will be processed within 3-5 business days to the original payment method.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">7. User Conduct</h2>
              <p className="leading-relaxed mb-3">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use the Platform for any unlawful purpose or in violation of any applicable law.</li>
                <li>Provide false, misleading, or fraudulent information.</li>
                <li>Attempt to gain unauthorized access to other users' accounts or our systems.</li>
                <li>Interfere with or disrupt the Platform's infrastructure or security features.</li>
                <li>Use automated tools (bots, scrapers) to access the Platform without permission.</li>
                <li>Resell or transfer reservations to third parties for profit.</li>
                <li>Engage in abusive behavior toward parking facility staff or other users.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">8. Vehicle Responsibility</h2>
              <p className="leading-relaxed">
                You are responsible for ensuring that the vehicle information registered on your account is accurate and matches the vehicle you bring to the parking facility. PakiPark is not liable for damage, theft, or loss of any vehicle or personal property while parked at participating facilities. Parking facility operators are responsible for the security and maintenance of their premises.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">9. Intellectual Property</h2>
              <p className="leading-relaxed">
                All content, features, and functionality of the Platform, including but not limited to text, graphics, logos, icons, images, software, and the PakiPark brand, are the exclusive property of PakiPark Inc. and are protected by Philippine and international intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without our express written consent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">10. Limitation of Liability</h2>
              <p className="leading-relaxed">
                To the maximum extent permitted by law, PakiPark shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform, including but not limited to loss of profits, data, or use. Our total liability for any claim arising under these Terms shall not exceed the amount you paid to PakiPark in the 12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">11. Disclaimer of Warranties</h2>
              <p className="leading-relaxed">
                The Platform is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. We do not guarantee that the Platform will be uninterrupted, error-free, or secure. We do not warrant the accuracy or completeness of parking availability data displayed on the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">12. Indemnification</h2>
              <p className="leading-relaxed">
                You agree to indemnify and hold harmless PakiPark Inc., its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including attorney's fees) arising from your use of the Platform, your violation of these Terms, or your violation of any third party's rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">13. Governing Law</h2>
              <p className="leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines. Any disputes arising under these Terms shall be resolved exclusively in the courts of Taguig City, Metro Manila, Philippines.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">14. Modifications to Terms</h2>
              <p className="leading-relaxed">
                PakiPark reserves the right to modify these Terms at any time. We will provide notice of material changes through the Platform or via email. Your continued use of the Platform after such modifications constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">15. Severability</h2>
              <p className="leading-relaxed">
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">16. Contact Information</h2>
              <p className="leading-relaxed">
                For questions about these Terms of Use, please contact us:
              </p>
              <div className="bg-[#f4f7fa] rounded-xl p-6 mt-3 space-y-2">
                <p><strong>PakiPark Inc.</strong></p>
                <p>Legal Department</p>
                <p>Email: legal@pakipark.ph</p>
                <p>Phone: +63 (2) 8888-PARK</p>
                <p>Address: BGC, Taguig City, Metro Manila, Philippines</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
