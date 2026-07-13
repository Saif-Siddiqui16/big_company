import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import { message } from 'antd';
import { API_URL } from '../config';

// Icons
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const NewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [newsPosts, setNewsPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const [newsRes, blogsRes] = await Promise.all([
          axios.get(`${API_URL}/content/public/news`),
          axios.get(`${API_URL}/content/public/blogs`)
        ]);

        const taggedNews = newsRes.data.map((item: any) => ({ ...item, type: 'News' }));
        const taggedBlogs = blogsRes.data.map((item: any) => ({ ...item, type: 'Blog' }));

        const combined = [...taggedNews, ...taggedBlogs].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setNewsPosts(combined);
      } catch (error) {
        console.error('Error fetching news:', error);
        message.error('Failed to load news');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-200">
      {/* Background elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-2 bg-transparent text-blue-400 hover:text-blue-300 transition-colors mb-8 font-semibold border-none outline-none cursor-pointer p-0"
        >
          <ArrowLeftIcon /> Back to Home
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            All News & Insights
          </h1>
          <p className="text-xl text-gray-400">
            Stay updated with our latest innovations and corporate announcements.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsPosts.map((post, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                onClick={() => {
                  setSelectedPost(post);
                  setIsPostModalOpen(true);
                }}
                className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 group cursor-pointer flex flex-col h-full shadow-lg hover:shadow-blue-900/20 transition-all duration-300"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={post.image || "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=800"}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${post.type === 'Blog' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {post.type || post.category || 'News'}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {dayjs(post.publishedAt || post.date || post.createdAt).format('MMM DD, YYYY')}
                    </span>
                  </div>
                  <h3 className="text-white text-xl font-bold mb-4 group-hover:text-blue-400 transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-6 line-clamp-3 flex-grow">
                    {post.shortDescription || post.blogText?.substring(0, 150) + '...'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {isPostModalOpen && selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden relative shadow-2xl"
          >
            <button
              onClick={() => setIsPostModalOpen(false)}
              className="absolute top-6 right-6 z-20 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="overflow-y-auto max-h-[90vh]">
              <div className="h-64 md:h-80 w-full relative">
                <img
                  src={selectedPost.image || "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=800"}
                  className="w-full h-full object-cover"
                  alt=""
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              </div>

              <div className="p-8 md:p-12 -mt-12 relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${selectedPost.type === 'Blog' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {selectedPost.type || selectedPost.category || 'News'}
                  </span>
                  <span className="text-gray-400 text-sm font-medium">
                    {dayjs(selectedPost.publishedAt || selectedPost.date || selectedPost.createdAt).format('MMMM DD, YYYY')}
                  </span>
                </div>

                <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight">
                  {selectedPost.title}
                </h2>

                <div className="flex items-center gap-4 mb-10 pb-8 border-b border-white/5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {selectedPost.author?.charAt(0) || 'B'}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{selectedPost.author || 'BIG Editorial'}</p>
                    <p className="text-gray-500 text-sm">Corporate Communications</p>
                  </div>
                </div>

                <div className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                  {selectedPost.fullContent || selectedPost.blogText}
                </div>

                <div className="mt-12">
                  <button
                    onClick={() => setIsPostModalOpen(false)}
                    className="bg-white text-slate-950 font-bold py-4 px-8 rounded-2xl hover:bg-gray-200 transition-colors"
                  >
                    Close Article
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default NewsPage;
