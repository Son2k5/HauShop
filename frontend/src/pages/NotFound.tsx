import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Banner */}
      <div className="bg-black text-white py-3">
        <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-4">
          <p className="text-sm">Summer Sale For All Swim Suits And Free Express Delivery - OFF 50%!</p>
          <Link to="/" className="text-sm font-semibold underline hover:opacity-80">
            ShopNow
          </Link>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-black">
            Home
          </Link>
          <span>›</span>
          <span className="text-black">404 Error</span>
        </div>
      </div>

      {/* 404 Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-10 py-20">
        <h1 className="text-9xl font-bold text-black tracking-wider">404 Not Found</h1>
        <p className="text-center text-gray-800 text-xl max-w-md">
          Your visited page not found. You may go home page.
        </p>
        <Link
          to="/"
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-12 rounded transition-colors"
        >
          Back to home page
        </Link>
      </div>
    </div>
  );
}
