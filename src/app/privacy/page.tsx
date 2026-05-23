'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Shield } from 'lucide-react';

const LOGO_SRC = '/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f4f7fa]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="size-5 text-[#1e3d5a]" />
          </button>
          <img src={LOGO_SRC} alt="PakiPark" className="h-8 object-contain cursor-pointer" onClick={() => router.push('/')} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="size-14 bg-[#1e3d5a] rounded-2xl flex items-center justify-center">
              <Shield className="size-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#1e3d5a]">Privacy Policy</h1>
              <p className="text-gray-500 text-sm">Last updated: March 12, 2026</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none space-y-8 text-gray-700">
            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">1. Introduction</h2>
              <p className="leading-relaxed">
                PakiPark ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (collectively, the "Platform"). By accessing or using PakiPark, you agree to the terms of this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">2. Information We Collect</h2>
              <p className="leading-relaxed mb-3">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Account Information:</strong> Name, email address, phone number, and password when you create an account.</li>
                <li><strong>Vehicle Information:</strong> Vehicle brand, model, color, plate number, and type for booking purposes.</li>
                <li><strong>Payment Information:</strong> Payment method details (e.g., GCash, Maya, credit/debit card numbers) processed through secure third-party payment gateways.</li>
                <li><strong>Booking Data:</strong> Parking location, date, time slot, and booking references.</li>
                <li><strong>Business Partner Documents:</strong> Business permits, DTI/SEC registration, and proof of ownership for admin accounts.</li>
                <li><strong>Usage Data:</strong> Device information, IP address, browser type, pages visited, and interaction patterns collected automatically.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">3. How We Use Your Information</h2>
              <p className="leading-relaxed mb-3">We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Create and manage your PakiPark account.</li>
                <li>Process parking reservations and payments.</li>
                <li>Send booking confirmations, reminders, and receipts.</li>
                <li>Provide customer support and respond to inquiries.</li>
                <li>Improve our Platform, features, and user experience.</li>
                <li>Verify Business Partner applications and documentation.</li>
                <li>Detect and prevent fraudulent transactions and unauthorized access.</li>
                <li>Comply with legal obligations under Philippine law, including the Data Privacy Act of 2012 (RA 10173).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">4. Data Sharing and Disclosure</h2>
              <p className="leading-relaxed mb-3">We do not sell your personal data. We may share your information with:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Parking Facility Operators:</strong> Your name, vehicle details, and booking information to facilitate your reservation.</li>
                <li><strong>Payment Processors:</strong> GCash, Maya, and card payment partners for transaction processing.</li>
                <li><strong>Service Providers:</strong> Email, SMS, and cloud hosting providers that help us operate the Platform.</li>
                <li><strong>Law Enforcement:</strong> When required by law, court order, or government regulation.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">5. Data Security</h2>
              <p className="leading-relaxed">
                We implement industry-standard security measures including encryption (SSL/TLS), secure password hashing (bcrypt), JWT-based authentication, and access controls. However, no electronic transmission or storage method is 100% secure. We encourage you to use strong passwords and enable two-factor authentication when available.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">6. Data Retention</h2>
              <p className="leading-relaxed">
                We retain your personal data for as long as your account is active or as needed to provide services. Booking records are retained for a minimum of 3 years for accounting and legal compliance. You may request deletion of your account and associated data at any time, subject to legal retention requirements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">7. Your Rights Under the Data Privacy Act</h2>
              <p className="leading-relaxed mb-3">Under RA 10173, you have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data.</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information.</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data.</li>
                <li><strong>Object:</strong> Object to the processing of your data for certain purposes.</li>
                <li><strong>Portability:</strong> Receive your data in a machine-readable format.</li>
              </ul>
              <p className="leading-relaxed mt-3">
                To exercise any of these rights, contact our Data Protection Officer at <strong>privacy@pakipark.ph</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">8. Cookies and Tracking</h2>
              <p className="leading-relaxed">
                We use cookies and similar technologies to remember your preferences, maintain your session, and analyze usage patterns. You can manage cookie settings through your browser. Disabling cookies may affect certain features of the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">9. Third-Party Links</h2>
              <p className="leading-relaxed">
                Our Platform may contain links to third-party websites or services (e.g., Google Maps, payment gateways). We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">10. Children's Privacy</h2>
              <p className="leading-relaxed">
                PakiPark is not intended for users under the age of 18. We do not knowingly collect personal information from minors. If we become aware that a child has provided us with personal data, we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">11. Changes to This Policy</h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of material changes via email or through a notice on our Platform. Your continued use after such changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1e3d5a] mb-3">12. Contact Us</h2>
              <p className="leading-relaxed">
                If you have questions or concerns about this Privacy Policy, please contact us:
              </p>
              <div className="bg-[#f4f7fa] rounded-xl p-6 mt-3 space-y-2">
                <p><strong>PakiPark Inc.</strong></p>
                <p>Data Protection Officer</p>
                <p>Email: privacy@pakipark.ph</p>
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
