import { Icon } from '@iconify/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Form data:', formData);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: 'lucide:phone',
      title: 'Điện thoại',
      content: '+88015-88888-9999',
      note: 'Hỗ trợ tư vấn và giải đáp nhanh',
    },
    {
      icon: 'lucide:mail',
      title: 'Email',
      content: 'haucter2k5@gmail.com',
      note: 'Phù hợp cho yêu cầu chi tiết hơn',
    },
    {
      icon: 'lucide:map-pin',
      title: 'Địa chỉ',
      content: 'HanuUniversity',
      note: 'Làm việc theo lịch hẹn trước',
    },
  ];

  const quickSupport = [
    {
      icon: 'lucide:message-circle-heart',
      title: 'Tư vấn sản phẩm',
      description: 'Nhận gợi ý phù hợp với nhu cầu và ngân sách của bạn.',
    },
    {
      icon: 'lucide:package-check',
      title: 'Hỗ trợ đơn hàng',
      description: 'Kiểm tra tình trạng, vận chuyển và thông tin sản phẩm.',
    },
    {
      icon: 'lucide:shield-alert',
      title: 'Bảo hành & đổi trả',
      description: 'Tiếp nhận và hỗ trợ các trường hợp cần xử lý sau mua.',
    },
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-4">
          <p className="text-sm font-bodyFont text-lightText">
            <Link to="/" className="hover:text-red-500 transition-colors">
              Home
            </Link>{' '}
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-primeColor font-medium">Contact Us</span>
          </p>
        </div>
      </div>

      {/* Hero */}
      <section className="relative isolate">
        <div className="absolute inset-0 bg-gradient-to-br from-[#fff7f5] via-white to-[#fff3ef]" />
        <div className="absolute top-10 left-10 h-40 w-40 rounded-full bg-red-100 blur-3xl opacity-80 animate-pulse-slow" />
        <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-orange-100 blur-3xl opacity-70 animate-pulse-slow" />

        <div className="relative max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
            <div className="animate-slide-right">
              <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/80 px-4 py-2 text-sm font-medium text-red-500 shadow-sm">
                <Icon icon="lucide:mail-plus" />
                Kết nối với HauShop
              </span>

              <h1 className="mt-6 text-4xl md:text-5xl xl:text-6xl font-bold font-titleFont leading-tight text-primeColor">
                Chúng tôi luôn sẵn sàng
                <span className="block text-red-500">lắng nghe bạn.</span>
              </h1>

              <p className="mt-6 text-base md:text-lg text-lightText leading-8 max-w-2xl font-bodyFont">
                Dù bạn cần tư vấn sản phẩm, hỗ trợ đơn hàng hay chỉ đơn giản là muốn góp ý cho trải nghiệm
                mua sắm tốt hơn, HauShop luôn sẵn sàng tiếp nhận và phản hồi nhanh chóng.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {contactInfo.map((info, index) => (
                  <div
                    key={info.title}
                    className="rounded-2xl bg-white/90 border border-white shadow-md px-4 py-5 animate-slide-up"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="w-11 h-11 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mb-3">
                      <Icon icon={info.icon} className="text-xl" />
                    </div>
                    <h3 className="font-semibold text-primeColor">{info.title}</h3>
                    <p className="mt-1 text-sm text-primeColor">{info.content}</p>
                    <p className="mt-2 text-xs text-lightText">{info.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative animate-slide-left">
              <div className="rounded-[32px] bg-gradient-to-br from-red-500 via-red-400 to-orange-400 p-6 md:p-8 text-white shadow-[0_30px_80px_rgba(239,68,68,0.25)]">
                <div className="rounded-[28px] border border-white/20 bg-white/10 backdrop-blur p-7 min-h-[360px] flex flex-col justify-between">
                  <div>
                    <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-6 animate-float">
                      <Icon icon="lucide:headset" className="text-3xl" />
                    </div>
                    <h3 className="text-3xl font-bold font-titleFont">Hỗ trợ nhanh, phản hồi rõ ràng</h3>
                    <p className="mt-4 text-white/90 leading-8">
                      Chúng tôi ưu tiên phản hồi đúng trọng tâm, nhanh chóng và thân thiện để bạn không phải chờ đợi quá lâu.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="rounded-2xl bg-white/10 border border-white/15 p-4">
                      <p className="text-white/75 text-sm">Phản hồi trung bình</p>
                      <p className="text-2xl font-bold mt-1">&lt; 24h</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 border border-white/15 p-4">
                      <p className="text-white/75 text-sm">Mức hài lòng</p>
                      <p className="text-2xl font-bold mt-1">98%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-4 hidden md:block rounded-2xl bg-white shadow-xl border border-gray-100 px-5 py-4 animate-float-slow">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <Icon icon="lucide:badge-check" className="text-xl" />
                  </div>
                  <div>
                    <p className="text-xs text-lightText">Cam kết hỗ trợ</p>
                    <p className="font-semibold text-primeColor">Nhanh chóng & tận tâm</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Support */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
            {quickSupport.map((item, index) => (
              <div
                key={item.title}
                className="group rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon icon={item.icon} className="text-2xl" />
                </div>
                <h3 className="text-xl font-semibold font-titleFont text-primeColor mb-2">{item.title}</h3>
                <p className="text-lightText leading-7">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + Location */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10">
          {/* Form */}
          <div className="rounded-[32px] border border-gray-100 bg-white shadow-card p-6 sm:p-8 lg:p-10 animate-slide-right">
            <div className="mb-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-red-50 text-red-500 px-4 py-2 text-sm font-medium">
                <Icon icon="lucide:send" />
                Gửi lời nhắn
              </span>
              <h2 className="mt-4 text-3xl font-bold font-titleFont text-primeColor">
                Liên hệ với chúng tôi
              </h2>
              <p className="mt-3 text-lightText leading-7">
                Hãy để lại thông tin, chúng tôi sẽ phản hồi lại bạn trong thời gian sớm nhất.
              </p>
            </div>

            {success && (
              <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-green-700 flex items-center gap-3 animate-fade-in">
                <Icon icon="lucide:check-circle-2" className="text-2xl shrink-0" />
                <span>Cảm ơn bạn! Chúng tôi đã nhận được lời nhắn và sẽ liên hệ lại sớm.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-primeColor mb-2">Tên của bạn</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Nhập tên của bạn"
                    className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-primeColor placeholder:text-lightText outline-none transition-all focus:border-red-400 focus:ring-4 focus:ring-red-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primeColor mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Nhập email của bạn"
                    className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-primeColor placeholder:text-lightText outline-none transition-all focus:border-red-400 focus:ring-4 focus:ring-red-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-primeColor mb-2">Điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                    className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-primeColor placeholder:text-lightText outline-none transition-all focus:border-red-400 focus:ring-4 focus:ring-red-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primeColor mb-2">Chủ đề</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="Nhập chủ đề"
                    className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-primeColor placeholder:text-lightText outline-none transition-all focus:border-red-400 focus:ring-4 focus:ring-red-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primeColor mb-2">Lời nhắn</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={7}
                  placeholder="Hãy chia sẻ vấn đề hoặc nhu cầu của bạn..."
                  className="w-full rounded-[24px] border border-gray-200 bg-white px-4 py-4 text-primeColor placeholder:text-lightText outline-none transition-all resize-none focus:border-red-400 focus:ring-4 focus:ring-red-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-medium px-7 py-3.5 rounded-full shadow-lg shadow-red-200 transition-all duration-300 hover:-translate-y-1 active:scale-95"
              >
                {loading ? (
                  <>
                    <Icon icon="lucide:loader-circle" className="text-xl animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    Gửi lời nhắn
                    <Icon icon="lucide:send-horizontal" className="text-lg" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Location / Showcase */}
          <div className="space-y-8 animate-slide-left">
            <div className="rounded-[32px] overflow-hidden border border-gray-100 shadow-card bg-white">
              <div className="p-8 border-b border-gray-100">
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200 text-primeColor px-4 py-2 text-sm font-medium">
                  <Icon icon="lucide:map-pinned" />
                  Vị trí của chúng tôi
                </span>
                <h2 className="mt-4 text-3xl font-bold font-titleFont text-primeColor">
                  Ghé thăm hoặc kết nối trực tuyến
                </h2>
                <p className="mt-3 text-lightText leading-7">
                  Bạn có thể nhúng Google Maps sau này, còn hiện tại phần này đã được thiết kế như một block nổi bật hơn nhiều.
                </p>
              </div>

              <div className="relative h-[420px] bg-gradient-to-br from-primeColor via-[#2c2c2c] to-[#4b4b4b] overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,white,transparent_35%),radial-gradient(circle_at_bottom_right,white,transparent_30%)]" />
                <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-red-400/20 blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-orange-300/20 blur-3xl animate-pulse-slow" />

                <div className="relative h-full flex flex-col items-center justify-center text-center px-8 text-white">
                  <div className="w-24 h-24 rounded-[28px] bg-white/10 border border-white/20 backdrop-blur flex items-center justify-center mb-6 animate-float">
                    <Icon icon="lucide:map-pin" className="text-5xl" />
                  </div>

                  <h3 className="text-3xl font-bold font-titleFont">HauShop Contact Point</h3>
                  <p className="mt-4 text-white/80 max-w-md leading-8">
                    Khu vực này có thể thay thế bằng bản đồ thật, hình ảnh văn phòng hoặc showroom để tăng độ tin cậy cho thương hiệu.
                  </p>

                  <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white text-primeColor px-5 py-3 font-medium shadow-xl">
                    <Icon icon="lucide:navigation" />
                    HanuUniversity
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-gray-100 bg-gradient-to-br from-white to-[#faf7f6] p-7 shadow-sm">
              <h3 className="text-2xl font-bold font-titleFont text-primeColor mb-4">
                Cần phản hồi nhanh hơn?
              </h3>
              <p className="text-lightText leading-7 mb-6">
                Hãy để lại đầy đủ email, số điện thoại và nội dung cụ thể để đội ngũ của chúng tôi hỗ trợ nhanh và chính xác hơn.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                    <Icon icon="lucide:circle-check-big" />
                  </div>
                  <p className="text-lightText">Mô tả rõ nhu cầu hoặc vấn đề bạn đang gặp.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                    <Icon icon="lucide:circle-check-big" />
                  </div>
                  <p className="text-lightText">Cung cấp thông tin liên hệ chính xác để được phản hồi thuận tiện.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                    <Icon icon="lucide:circle-check-big" />
                  </div>
                  <p className="text-lightText">Nếu liên quan đơn hàng, nên kèm mã đơn hoặc thông tin sản phẩm.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;