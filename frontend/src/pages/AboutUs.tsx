import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  const features = [
    {
      icon: 'lucide:truck',
      title: 'Giao hàng nhanh toàn quốc',
      description:
        'Đơn hàng được xử lý nhanh chóng, theo dõi minh bạch và giao tới khách hàng trên toàn Việt Nam.',
    },
    {
      icon: 'lucide:headset',
      title: 'Hỗ trợ tận tâm 24/7',
      description:
        'Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ bạn từ khâu tư vấn đến sau mua hàng.',
    },
    {
      icon: 'lucide:shield-check',
      title: 'Thanh toán an toàn',
      description:
        'Thông tin thanh toán được bảo vệ với quy trình bảo mật và kiểm tra giao dịch đáng tin cậy.',
    },
    {
      icon: 'lucide:star',
      title: 'Sản phẩm tuyển chọn',
      description:
        'Chúng tôi tập trung vào chất lượng, thẩm mỹ và trải nghiệm sử dụng thực tế của từng sản phẩm.',
    },
  ];

  const stats = [
    { number: '10M+', label: 'Khách hàng mỗi năm', icon: 'lucide:users' },
    { number: '500+', label: 'Đối tác & cửa hàng', icon: 'lucide:store' },
    { number: '50+', label: 'Năm kinh nghiệm', icon: 'lucide:badge-check' },
    { number: '25K+', label: 'Sản phẩm nổi bật', icon: 'lucide:package' },
  ];

  const values = [
    {
      icon: 'lucide:sparkles',
      title: 'Tinh chọn',
      description: 'Chúng tôi ưu tiên những sản phẩm có tính ứng dụng, thẩm mỹ và giá trị sử dụng lâu dài.',
    },
    {
      icon: 'lucide:heart-handshake',
      title: 'Tận tâm',
      description: 'Mỗi trải nghiệm của khách hàng đều được xem là trung tâm trong quá trình vận hành.',
    },
    {
      icon: 'lucide:rocket',
      title: 'Đổi mới',
      description: 'Không ngừng nâng cấp nền tảng, dịch vụ và trải nghiệm mua sắm hiện đại hơn mỗi ngày.',
    },
  ];

  const team = [
    {
      name: 'Nguyễn Văn A',
      position: 'Chief Executive Officer',
      icon: 'lucide:crown',
    },
    {
      name: 'Trần Thị B',
      position: 'Marketing Director',
      icon: 'lucide:megaphone',
    },
    {
      name: 'Lê Văn C',
      position: 'Tech Director',
      icon: 'lucide:code-2',
    },
    {
      name: 'Phạm Thị D',
      position: 'Sales Director',
      icon: 'lucide:bar-chart-3',
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
            <span className="text-primeColor font-medium">About Us</span>
          </p>
        </div>
      </div>

      {/* Hero */}
      <section className="relative isolate">
        <div className="absolute inset-0 bg-gradient-to-br from-[#fff7f5] via-white to-[#fff1ec]" />
        <div className="absolute top-14 left-8 w-40 h-40 rounded-full bg-red-100 blur-3xl opacity-80 animate-pulse-slow" />
        <div className="absolute bottom-10 right-8 w-56 h-56 rounded-full bg-orange-100 blur-3xl opacity-70 animate-pulse-slow" />

        <div className="relative max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="animate-slide-right">
              <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/80 px-4 py-2 text-sm font-medium text-red-500 shadow-sm">
                <Icon icon="lucide:sparkles" className="text-base" />
                Thương hiệu mua sắm hiện đại
              </span>

              <h1 className="mt-6 text-4xl md:text-5xl xl:text-6xl font-bold font-titleFont leading-tight text-primeColor">
                Chúng tôi không chỉ bán sản phẩm,
                <span className="block text-red-500">chúng tôi tạo nên trải nghiệm.</span>
              </h1>

              <p className="mt-6 text-base md:text-lg text-lightText leading-8 max-w-2xl font-bodyFont">
                HauShop được xây dựng với mục tiêu mang đến trải nghiệm mua sắm trực tuyến trực quan,
                đáng tin cậy và truyền cảm hứng hơn. Chúng tôi kết hợp sản phẩm chất lượng, dịch vụ
                chỉn chu và giao diện hiện đại để mỗi lần mua sắm đều trở nên dễ chịu hơn.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium shadow-lg shadow-red-200 transition-all duration-300 hover:-translate-y-1"
                >
                  Khám phá sản phẩm
                  <Icon icon="lucide:arrow-right" />
                </Link>

                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-red-300 text-primeColor px-6 py-3 rounded-full font-medium transition-all duration-300 hover:-translate-y-1"
                >
                  Liên hệ với chúng tôi
                  <Icon icon="lucide:phone-call" />
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl bg-white/90 border border-white shadow-md px-4 py-5 animate-slide-up"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mb-3">
                      <Icon icon={stat.icon} className="text-lg" />
                    </div>
                    <div className="text-2xl font-bold font-titleFont text-primeColor">{stat.number}</div>
                    <p className="text-sm text-lightText mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative animate-slide-left">
              <div className="relative rounded-[32px] border border-white/70 bg-white/80 backdrop-blur shadow-[0_30px_80px_rgba(0,0,0,0.08)] p-5 md:p-7">
                <div className="aspect-[5/4] rounded-[28px] bg-gradient-to-br from-red-500 via-red-400 to-orange-400 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.18),transparent_30%)]" />

                  <div className="absolute top-6 left-6 bg-white/15 backdrop-blur rounded-2xl px-4 py-3 text-white border border-white/20 animate-float">
                    <p className="text-xs uppercase tracking-[3px] opacity-80">HauShop</p>
                    <p className="text-xl font-semibold mt-1">Retail Experience</p>
                  </div>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-6">
                    <div className="w-24 h-24 rounded-[28px] bg-white/15 backdrop-blur flex items-center justify-center mb-6 border border-white/20 shadow-lg animate-float-slow">
                      <Icon icon="lucide:shopping-bag" className="text-5xl" />
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold font-titleFont">Tinh gọn, hiện đại, đáng tin cậy</h3>
                    <p className="mt-4 text-white/90 max-w-md leading-7">
                      Một nền tảng mua sắm được tối ưu để đẹp hơn, nhanh hơn và gần gũi hơn với người dùng.
                    </p>
                  </div>

                  <div className="absolute bottom-6 right-6 bg-white text-primeColor rounded-2xl px-4 py-3 shadow-xl animate-float">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                        <Icon icon="lucide:star" className="text-lg" />
                      </div>
                      <div>
                        <p className="text-xs text-lightText">Customer Trust</p>
                        <p className="font-semibold">4.9/5 đánh giá</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-4 hidden md:block rounded-2xl bg-white shadow-xl border border-gray-100 px-5 py-4 animate-float-slow">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <Icon icon="lucide:shield-check" className="text-xl" />
                  </div>
                  <div>
                    <p className="text-xs text-lightText">Bảo chứng dịch vụ</p>
                    <p className="font-semibold text-primeColor">Hỗ trợ & thanh toán an toàn</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story + Values */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-10">
          <div className="rounded-[30px] border border-gray-100 bg-white shadow-card p-8 md:p-10 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 text-red-500 px-4 py-2 text-sm font-medium">
              <Icon icon="lucide:building-2" />
              Câu chuyện thương hiệu
            </div>

            <h2 className="mt-5 text-3xl md:text-4xl font-bold font-titleFont text-primeColor">
              Từ một cửa hàng bán lẻ đến hệ sinh thái mua sắm truyền cảm hứng
            </h2>

            <div className="mt-6 space-y-5 text-lightText leading-8 font-bodyFont">
              <p>
                HauShop bắt đầu từ mong muốn làm cho trải nghiệm mua sắm trở nên đơn giản nhưng không nhàm chán.
                Chúng tôi tin rằng một cửa hàng tốt không chỉ nằm ở sản phẩm, mà còn ở cảm giác người dùng nhận
                được khi tìm kiếm, lựa chọn và đặt mua.
              </p>
              <p>
                Chính vì vậy, chúng tôi tập trung vào việc xây dựng một hệ sinh thái vừa đẹp về giao diện,
                mượt về trải nghiệm, vừa đáng tin cậy ở khâu vận hành. Mỗi trang, mỗi tính năng và mỗi sản phẩm
                đều được hoàn thiện với cùng một mục tiêu: giúp khách hàng cảm thấy dễ dàng và hứng thú hơn khi mua sắm.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {values.map((item, index) => (
              <div
                key={item.title}
                className="group rounded-[26px] border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 90}ms` }}
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

      {/* Features */}
      <section className="bg-[#faf7f6] border-y border-gray-100">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-20">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-white border border-red-100 text-red-500 px-4 py-2 text-sm font-medium">
              <Icon icon="lucide:gem" />
              Lý do khách hàng chọn HauShop
            </span>
            <h2 className="mt-5 text-3xl md:text-4xl font-bold font-titleFont text-primeColor">
              Trải nghiệm mua sắm toàn diện hơn, chỉn chu hơn
            </h2>
            <p className="mt-4 text-lightText leading-7">
              Chúng tôi không chỉ tập trung vào giao diện đẹp mà còn tối ưu vận hành, chăm sóc và độ tin cậy trong từng điểm chạm.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-[28px] border border-white bg-white p-7 md:p-8 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-red-50 blur-2xl opacity-70 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-red-500 text-white flex items-center justify-center mb-5 shadow-lg shadow-red-200">
                    <Icon icon={feature.icon} className="text-2xl" />
                  </div>
                  <h3 className="text-xl font-semibold font-titleFont text-primeColor mb-3">{feature.title}</h3>
                  <p className="text-lightText leading-7">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-[30px] bg-gradient-to-br from-red-500 to-orange-400 text-white p-8 md:p-10 shadow-2xl animate-slide-right">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-6">
              <Icon icon="lucide:target" className="text-2xl" />
            </div>
            <h3 className="text-3xl font-bold font-titleFont mb-4">Sứ mệnh</h3>
            <p className="leading-8 text-white/90">
              Mang đến sản phẩm chất lượng cao cùng trải nghiệm mua sắm trực tuyến hiện đại, minh bạch và gần gũi,
              giúp khách hàng đưa ra lựa chọn dễ dàng hơn mỗi ngày.
            </p>
          </div>

          <div className="rounded-[30px] border border-gray-100 bg-white p-8 md:p-10 shadow-card animate-slide-left">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-6">
              <Icon icon="lucide:eye" className="text-2xl" />
            </div>
            <h3 className="text-3xl font-bold font-titleFont text-primeColor mb-4">Tầm nhìn</h3>
            <p className="leading-8 text-lightText">
              Trở thành thương hiệu thương mại điện tử được yêu thích nhờ sự tinh tế trong trải nghiệm, sự đáng tin trong dịch vụ,
              và khả năng kết nối sản phẩm phù hợp với đúng nhu cầu của người dùng.
            </p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-10 pb-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200 text-primeColor px-4 py-2 text-sm font-medium">
            <Icon icon="lucide:users-round" />
            Đội ngũ của chúng tôi
          </span>
          <h2 className="mt-5 text-3xl md:text-4xl font-bold font-titleFont text-primeColor">
            Những con người đứng sau trải nghiệm HauShop
          </h2>
          <p className="mt-4 text-lightText leading-7">
            Chúng tôi là một tập thể kết hợp giữa tư duy công nghệ, cảm quan thẩm mỹ và sự am hiểu khách hàng.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {team.map((member, index) => (
            <div
              key={member.name}
              className="group rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-slide-up"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="relative mb-5">
                <div className="aspect-square rounded-[24px] bg-gradient-to-br from-gray-100 via-gray-50 to-white border border-gray-100 flex items-center justify-center overflow-hidden">
                  <div className="w-24 h-24 rounded-[26px] bg-red-50 text-red-500 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <Icon icon={member.icon} className="text-5xl" />
                  </div>
                </div>
                <div className="absolute -bottom-3 right-4 w-12 h-12 rounded-2xl bg-white shadow-lg border border-gray-100 flex items-center justify-center text-primeColor">
                  <Icon icon="lucide:badge-check" className="text-lg" />
                </div>
              </div>

              <h3 className="text-lg font-semibold font-titleFont text-primeColor">{member.name}</h3>
              <p className="text-lightText mt-1">{member.position}</p>

              <div className="mt-5 flex items-center gap-3 text-lightText">
                <a href="#" className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
                  <Icon icon="lucide:linkedin" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
                  <Icon icon="lucide:twitter" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
                  <Icon icon="lucide:mail" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutUs;