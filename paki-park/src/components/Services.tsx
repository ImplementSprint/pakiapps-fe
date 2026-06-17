import { Car, Calendar, CreditCard, Bell, MapPin, Shield } from 'lucide-react';

const services = [
  { icon: MapPin,      title: 'Real-time Availability',  description: 'Find available parking spots near you in real-time with our interactive map view.',              color: '#f43f5e', light: '#fff0f2' },
  { icon: Calendar,    title: 'Advanced Reservations',   description: 'Book your parking spot hours or days in advance to guarantee your space.',                       color: '#8b5cf6', light: '#f5f0ff' },
  { icon: CreditCard,  title: 'Cashless Payments',       description: 'Pay securely through the app with multiple payment options including cards and digital wallets.', color: '#10b981', light: '#f0fdf8' },
  { icon: Bell,        title: 'Smart Notifications',     description: 'Get timely reminders about your reservation and parking duration.',                               color: '#f59e0b', light: '#fffbeb' },
  { icon: Car,         title: 'Multiple Vehicles',       description: 'Manage parking for multiple vehicles from a single account.',                                     color: '#0ea5e9', light: '#f0f9ff' },
  { icon: Shield,      title: 'Secure Facilities',       description: 'All parking locations are verified and equipped with security features.',                         color: '#ec4899', light: '#fdf0f7' },
];

export function Services() {
  return (
    <section id="services" className="py-16 bg-[#f8fafc]">
      <style>{`
        .service-card {
          transition: all 0.35s cubic-bezier(0.34, 1.2, 0.64, 1);
        }
        .service-card:hover {
          transform: translateY(-6px);
        }
        .service-card .blob {
          transition: transform 0.4s ease;
          transform: scale(1);
        }
        .service-card:hover .blob {
          transform: scale(2);
        }
        .service-card .card-icon {
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .service-card .accent-line {
          opacity: 0;
          transition: opacity 0.3s;
        }
        .service-card:hover .accent-line {
          opacity: 1;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block bg-gradient-to-r from-[#1e3d5a] to-[#2a5373] text-white text-[11px] font-bold tracking-[0.15em] uppercase px-5 py-2 rounded-full mb-4">
            What We Offer
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1e3d5a] mb-3">
            Our Services
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Everything you need for a seamless parking experience, all in one super app.
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="service-card group relative bg-white rounded-3xl border-2 border-[#f1f5f9] hover:border-opacity-60 p-9 flex flex-col items-center text-center overflow-hidden"
              style={{
                '--accent': service.color,
                '--light': service.light,
              } as React.CSSProperties}
            >
              {/* Hover border color via inline style on hover handled by group */}
              <style>{`
                .service-card:nth-child(${index + 1}):hover {
                  border-color: ${service.color}60;
                  background: ${service.light};
                  box-shadow: 0 20px 50px ${service.color}25, 0 4px 16px ${service.color}15;
                }
                .service-card:nth-child(${index + 1}) .card-icon {
                  background: ${service.light};
                  box-shadow: 0 2px 8px ${service.color}25;
                }
                .service-card:nth-child(${index + 1}):hover .card-icon {
                  background: ${service.color};
                  box-shadow: 0 8px 24px ${service.color}50;
                  transform: scale(1.12) rotate(6deg);
                }
                .service-card:nth-child(${index + 1}):hover .card-icon svg {
                  color: white !important;
                }
                .service-card:nth-child(${index + 1}):hover .card-title {
                  color: ${service.color};
                }
                .service-card:nth-child(${index + 1}) .blob {
                  background: ${service.color}12;
                }
                .service-card:nth-child(${index + 1}) .accent-line {
                  background: linear-gradient(90deg, transparent, ${service.color}, transparent);
                }
              `}</style>

              {/* Decorative blob */}
              <div className="blob absolute -top-8 -right-8 w-24 h-24 rounded-full" />

              {/* Icon */}
              <div className="card-icon size-16 rounded-2xl flex items-center justify-center mb-5 relative z-10">
                <service.icon
                  className="size-7 transition-colors duration-300"
                  style={{ color: service.color }}
                  strokeWidth={2}
                />
              </div>

              {/* Title */}
              <h3 className="card-title text-base font-bold text-[#1e293b] mb-2.5 transition-colors duration-300 relative z-10">
                {service.title}
              </h3>

              {/* Description */}
              <p className="text-gray-400 text-sm leading-relaxed relative z-10">
                {service.description}
              </p>

              {/* Bottom accent line */}
              <div className="accent-line absolute bottom-0 left-0 right-0 h-[3px] rounded-b-3xl" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
