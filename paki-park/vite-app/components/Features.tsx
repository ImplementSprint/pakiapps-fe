import mascotWaving from '../../assets/c548305214f224f7cd95d5e8ffe3367d7d6a87b5.png';
import { Check, Smartphone, Navigation2, Clock, CreditCard } from 'lucide-react';

const features = [
  'Easy-to-use mobile app interface',
  'GPS navigation to parking spot',
  'Flexible cancellation policy',
  'Customer support 24/7',
  'Monthly parking passes available',
];

export function Features() {
  return (
    <section id="features" className="py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-24 items-center">

          {/* Left — mascot + icon grid */}
          <div className="order-2 md:order-1 flex items-center justify-center gap-0">

            {/* Mascot */}
            <img
              src={mascotWaving}
              alt="PakiPark Mascot"
              className="w-40 lg:w-70 h-auto object-contain flex-shrink-0"
            />

            {/* Icon grid — overflow-visible so badge isn't clipped */}
            <div className="relative pb-6 pr-6">
              <div className="size-80 bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-3xl flex items-center justify-center shadow-2xl border-4 border-[#ee6b20]/30 relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(238,107,32,0.2),transparent_50%)] rounded-3xl" />
                <div className="relative grid grid-cols-2 gap-6 p-8">
                  <div className="size-28 bg-white/10 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-2 border border-white/20">
                    <Smartphone className="size-12 text-[#ee6b20]" />
                    <span className="text-xs text-white font-medium">Mobile App</span>
                  </div>
                  <div className="size-28 bg-white/10 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-2 border border-white/20">
                    <Navigation2 className="size-12 text-[#ee6b20]" />
                    <span className="text-xs text-white font-medium">GPS Nav</span>
                  </div>
                  <div className="size-28 bg-white/10 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-2 border border-white/20">
                    <CreditCard className="size-12 text-[#ee6b20]" />
                    <span className="text-xs text-white font-medium">Secure Pay</span>
                  </div>
                  <div className="size-28 bg-white/10 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-2 border border-white/20">
                    <Clock className="size-12 text-[#ee6b20]" />
                    <span className="text-xs text-white font-medium">24/7 Support</span>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-[#ee6b20] text-white px-6 py-3 rounded-full shadow-xl border-4 border-white font-bold">
                  Premium Features
                </div>
              </div>
            </div>

          </div>

          {/* Right Content */}
          <div className="order-1 md:order-2 space-y-5">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1e3d5a] mb-3">
                Why Choose PakiPark?
              </h2>
              <p className="text-base text-gray-600">
                We've built the most comprehensive parking solution to save you
                time, money, and stress. Here's what makes us different:
              </p>
            </div>

            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="size-5 bg-[#ee6b20] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="size-3 text-white" />
                  </div>
                  <p className="text-gray-700">{feature}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#ee6b20]/10 border-l-4 border-[#ee6b20] p-4 rounded-r-lg">
              <p className="text-gray-700 text-sm">
                <span className="font-bold text-[#ee6b20]">
                  "PakiPark has transformed the way I find parking.
                </span>{' '}
                No more driving around for 30 minutes looking for a spot!"
              </p>
              <p className="text-xs text-gray-600 mt-1">- Sarah M., Regular User</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
