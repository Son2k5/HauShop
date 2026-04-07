import { Icon } from '@iconify/react';

const AboutUs = () => {
  const features = [
    {
      icon: 'lucide:truck',
      title: 'Giao hàng nhanh',
      description: 'Chúng tôi cung cấp dịch vụ giao hàng nhanh chóng đến tất cả các địa điểm ở Việt Nam',
    },
    {
      icon: 'lucide:headset',
      title: 'Hỗ trợ khách hàng 24/7',
      description: 'Đội ngũ hỗ trợ khách hàng của chúng tôi luôn sẵn sàng giúp bạn bất cứ lúc nào',
    },
    {
      icon: 'lucide:shield-check',
      title: 'Thanh toán an toàn',
      description: 'Chúng tôi sử dụng các phương thức thanh toán an toàn và được bảo mật cao',
    },
    {
      icon: 'lucide:star',
      title: 'Sản phẩm chất lượng',
      description: 'Tất cả sản phẩm của chúng tôi đều được kiểm tra chất lượng kỹ lưỡng',
    },
  ];

  const stats = [
    { number: '10M+', label: 'Khách hàng hàng năm' },
    { number: '500+', label: 'Cửa hàng bán lẻ' },
    { number: '50+', label: 'Năm kinh nghiệm' },
    { number: '25K+', label: 'Sản phẩm' },
  ];

  const team = [
    {
      name: 'Nguyễn Văn A',
      position: 'Giám đốc điều hành',
      image: '',
    },
    {
      name: 'Trần Thị B',
      position: 'Giám đốc tiếp thị',
      image: '',
    },
    {
      name: 'Lê Văn C',
      position: 'Giám đốc kỹ thuật',
      image: '',
    },
    {
      name: 'Phạm Thị D',
      position: 'Giám đốc bán hàng',
      image: '',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">
            <span className="text-gray-400">Home</span> / <span className="text-gray-900">About Us</span>
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Về Chúng Tôi</h1>
            <p className="text-lg text-gray-600 mb-4">
              Chúng tôi là một công ty bán lẻ hàng đầu với hơn 50 năm kinh nghiệm trong ngành. 
              Chúng tôi cam kết cung cấp sản phẩm chất lượng cao và dịch vụ khách hàng tuyệt vời.
            </p>
            <p className="text-lg text-gray-600">
              Với sự tín nhiệm của hơn 10 triệu khách hàng mỗi năm, chúng tôi tiếp tục phát triển 
              và cải thiện để đáp ứng nhu cầu của bạn.
            </p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center text-white">
              <Icon icon="lucide:shopping-bag" className="text-8xl mx-auto mb-4" />
              <p className="text-xl font-semibold">HauShop</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16 border-y border-gray-200">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold text-red-500 mb-2">{stat.number}</div>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="py-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Tại Sao Chọn Chúng Tôi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
                  <Icon icon={feature.icon} className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="py-16 border-t border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Đội Ngũ Của Chúng Tôi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center mb-4 text-6xl">
                  {member.image}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-gray-600">{member.position}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="py-16 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-red-50 rounded-lg p-8 border border-red-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Icon icon="lucide:target" className="text-red-500 text-2xl" />
                Sứ Mệnh của Chúng Tôi
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Cung cấp sản phẩm chất lượng cao với giá cạnh tranh, kết hợp với dịch vụ khách hàng 
                xuất sắc để giúp cải thiện cuộc sống của mỗi khách hàng.
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-8 border border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Icon icon="lucide:eye" className="text-blue-500 text-2xl" />
                Tầm Nhìn của Chúng Tôi
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Trở thành công ty bán lẻ hàng đầu ở châu Á, được công nhận vì sự đổi mới, 
                chất lượng sản phẩm và sự hài lòng của khách hàng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
