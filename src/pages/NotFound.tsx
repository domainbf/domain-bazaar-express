
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 px-4 py-12">
      <div className="bg-white rounded-xl shadow-lg px-8 py-12 flex flex-col items-center animate-fade-in">
        <div className="text-7xl font-bold text-gray-900 mb-4 select-none">404</div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">页面未找到</h1>
        <p className="text-gray-500 mb-6 text-center">抱歉，您访问的页面不存在或已被移除。</p>
        <div className="flex gap-4 mt-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-5 py-2 rounded-md bg-gray-900 text-white font-semibold hover:bg-gray-800 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回上一页
          </button>
          <Link to="/">
            <button className="inline-flex items-center px-5 py-2 rounded-md border-2 border-gray-900 text-gray-900 font-semibold hover:bg-gray-900 hover:text-white transition">
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
