import { Icon } from '@iconify/react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { title: 'My Account', href: '#' },
    { title: 'Login / Register', href: '#' },
    { title: 'Cart', href: '#' },
    { title: 'Wishlist', href: '#' },
    { title: 'Shop', href: '#' },
  ];

  const policyLinks = [
    { title: 'Privacy Policy', href: '#' },
    { title: 'Terms Of Use', href: '#' },
    { title: 'FAQ', href: '#' },
    { title: 'Contact', href: '#' },
  ];

  return (
    <footer className="bg-black text-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12 pb-12 border-b border-white/40">
          {/* Exclusive Section */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 tracking-wide">HAUSHOP</h3>
              <h4 className="text-xl font-semibold mb-4">Subscribe</h4>
              <p className="text-base text-white/100">Get 10% off your first order</p>
            </div>

            <div className="relative">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-transparent border border-white/100 rounded px-4 py-3 text-white placeholder-white/40 focus:outline-none"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2">
                <Icon icon="lucide:mail" className="text-white/100 text-[20px]" />
              </button>
            </div>
          </div>

          {/* Support Section */}
          <div>
            <h4 className="text-xl font-semibold mb-6">Support</h4>
            <div className="space-y-4 text-base">
              <p>HanuUniversity.</p>
              <p>haucter2k5@gmail.com</p>
              <p>+88015-88888-9999</p>
            </div>
          </div>

          {/* Account Section */}
          <div>
            <h4 className="text-xl font-semibold mb-6">Account</h4>
            <nav className="space-y-4 text-base">
              {quickLinks.map((link) => (
                <a
                  key={link.title}
                  href={link.href}
                  className="block hover:text-white/80 transition-colors"
                >
                  {link.title}
                </a>
              ))}
            </nav>
          </div>

          {/* Quick Link Section */}
          <div>
            <h4 className="text-xl font-semibold mb-6">Quick Link</h4>
            <nav className="space-y-4 text-base">
              {policyLinks.map((link) => (
                <a
                  key={link.title}
                  href={link.href}
                  className="block hover:text-white/80 transition-colors"
                >
                  {link.title}
                </a>
              ))}
            </nav>
          </div>

          {/* Payment Section */}
          <div className="space-y-6">
            <div>
              <h4 className="text-xl font-semibold mb-4">Payment Methods</h4>
              <p className="text-xs text-white/70 mb-4">Secure payment with local providers</p>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              {/* MoMo Logo Image */}
              <div className="w-10 h-10 overflow-hidden rounded-lg">
                <img 
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKgYNSZSsp_IoaexKIiIPj2MOClxCVkxRpgg&s" 
                  alt="MoMo" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* VNPAY Logo Image */}
              <div className="h-10 bg-white px-2 flex items-center rounded-lg">
                <img 
                  src="data:image/png;base64,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" 
                  alt="VNPAY" 
                  className="h-6 object-contain"
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-6 pt-4">
              <a href="#" className="text-white hover:text-white/80 transition-colors" aria-label="Facebook">
                <Icon icon="ri:facebook-line" className="text-[24px]" />
              </a>
              <a href="#" className="text-white hover:text-white/80 transition-colors" aria-label="Twitter">
                <Icon icon="ri:twitter-x-line" className="text-[24px]" />
              </a>
              <a href="#" className="text-white hover:text-white/80 transition-colors" aria-label="LinkedIn">
                <Icon icon="ri:linkedin-line" className="text-[24px]" />
              </a>
              <a href="#" className="text-white hover:text-white/80 transition-colors" aria-label="Instagram">
                <Icon icon="ri:instagram-line" className="text-[24px]" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section - Copyright */}
        <div className="flex items-center gap-2 justify-center text-white/60 text-base">
          <div className="w-5 h-5 border border-white/60 rounded flex items-center justify-center">
            <div className="w-2 h-3 border-r-2 border-b-2 border-white/60 transform rotate-45"></div>
          </div>
          <span>Copyright Haucter {currentYear}. All right reserved</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;