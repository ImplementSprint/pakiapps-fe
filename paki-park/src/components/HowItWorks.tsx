export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-[#ebf4fa] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column: Descriptive Blocks */}
          <div className="space-y-6">
            <div className="mb-10 lg:text-left text-center">
              <h2 className="text-4xl font-extrabold text-[#1e3d5a] mb-4">How it works</h2>
              <p className="text-lg text-gray-500">
                Stop circling for a spot. PakiPark takes the guesswork out of parking so you can save time, money, and stress.
              </p>
            </div>

            {/* Block 1 */}
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-xl font-bold text-[#1e3d5a] mb-2">Find Your Spot Before You Go</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Don't waste fuel and time circling the block. Simply search for your destination, and PakiPark will show you all the available parking lots nearby on a map, along with their rates, amenities, and real-time availability.
              </p>
            </div>

            {/* Block 2 */}
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-xl font-bold text-[#1e3d5a] mb-2">Park Smarter, Not Harder</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Once you've picked a spot, the app will guide you directly to the entrance. You'll know exactly what to expect—whether the lot has CCTV, is covered, or has spaces for your motorcycle or bicycle—ensuring you park with peace of mind.
              </p>
            </div>

            {/* Block 3 */}
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-xl font-bold text-[#1e3d5a] mb-2">Save Time and Money</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                By using PakiPark, you're not just finding parking; you're making smarter decisions. Enjoy transparent rates without hidden fees, and choose the most affordable option close to your designated location.
              </p>
            </div>

            {/* Block 4 */}
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-xl font-bold text-[#1e3d5a] mb-2">Reserve Your Spot</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Imagine knowing a spot is waiting for you before you even leave home. We eliminate the guesswork and stress by allowing you to easily book and secure your parking space in advance.
              </p>
            </div>
          </div>

          {/* Right Column: Illustration Image */}
          <div className="relative flex justify-center items-center lg:justify-end">
            <div className="relative w-full max-w-md lg:max-w-lg aspect-[3/4]">
              {/* Circular glow effect */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#ee6b20]/10 rounded-full blur-3xl z-0" />
              
              <img
                src="/assets/mascot-phones.png"
                alt="PakiPark Mobile Stack with Mascot"
                className="relative z-10 object-contain w-full h-full drop-shadow-2xl hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
