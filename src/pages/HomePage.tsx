import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { motion, useInView, useAnimation } from 'framer-motion';
import { message } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

// Animated counter component
const AnimatedCounter: React.FC<{ end: number; duration?: number; suffix?: string; prefix?: string }> = ({
  end,
  duration = 2000,
  suffix = '',
  prefix = '',
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

// Floating particles component
const FloatingParticles: React.FC = () => {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white/10"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// Simple Icon Components
const ShoppingBagIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const StoreIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const TruckIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const InfoIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Mock chart data
const salesData = [
  { name: 'Jan', sales: 4000, orders: 240 },
  { name: 'Feb', sales: 3000, orders: 198 },
  { name: 'Mar', sales: 5000, orders: 300 },
  { name: 'Apr', sales: 4500, orders: 280 },
  { name: 'May', sales: 6000, orders: 390 },
  { name: 'Jun', sales: 5500, orders: 350 },
  { name: 'Jul', sales: 7000, orders: 420 },
];

const categoryData = [
  { name: 'Beverages', value: 35, color: '#667eea' },
  { name: 'Food', value: 28, color: '#764ba2' },
  { name: 'Electronics', value: 20, color: '#6B73FF' },
  { name: 'Personal Care', value: 17, color: '#00d9ff' },
];

const districtData = [
  { name: 'Kigali', value: 4500 },
  { name: 'Huye', value: 2800 },
  { name: 'Rubavu', value: 2200 },
  { name: 'Muhanga', value: 1900 },
  { name: 'Musanze', value: 1700 },
];

const realtimeData = [
  { time: '00:00', transactions: 120 },
  { time: '04:00', transactions: 80 },
  { time: '08:00', transactions: 350 },
  { time: '12:00', transactions: 520 },
  { time: '16:00', transactions: 480 },
  { time: '20:00', transactions: 390 },
  { time: '24:00', transactions: 150 },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('wholesaler');
  const controls = useAnimation();
  const [newsPosts, setNewsPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);


  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [newsRes, blogsRes] = await Promise.all([
          axios.get(`${API_URL}/content/public/news`),
          axios.get(`${API_URL}/content/public/blogs`)
        ]);

        // Tag and merge
        const taggedNews = newsRes.data.map((item: any) => ({ ...item, type: 'News' }));
        const taggedBlogs = blogsRes.data.map((item: any) => ({ ...item, type: 'Blog', shortDescription: item.blogText?.substring(0, 100) + '...' }));

        const combined = [...taggedNews, ...taggedBlogs].sort((a, b) =>
          new Date(b.publishedAt || b.date).getTime() - new Date(a.publishedAt || a.date).getTime()
        );

        setNewsPosts(combined);
      } catch (error) {
        console.error('Failed to fetch content');
      }
    };
    fetchContent();
  }, []);

  useEffect(() => {
    controls.start('visible');
  }, [controls]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePortalClick = (role: string) => {
    if (isAuthenticated && user?.role === role) {
      const dashboards: Record<string, string> = {
        consumer: '/consumer/shop',
        employee: '/employee/dashboard',
        retailer: '/retailer/dashboard',
        wholesaler: '/wholesaler/dashboard',
      };
      navigate(dashboards[role]);
    } else {
      navigate(`/login?role=${role}`);
    }
  };

  const portals = [
    {
      id: 'consumer',
      title: 'Consumer',
      subtitle: 'Shop & Order',
      description: 'Browse products, place orders, manage your wallet and NFC cards',
      icon: <ShoppingBagIcon />,
      gradient: 'from-emerald-500 to-teal-600',
      hoverGradient: 'hover:from-emerald-600 hover:to-teal-700',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      features: ['Browse Products', 'Mobile Wallet', 'NFC Cards', 'Order Tracking'],
      authType: 'phone',
      credentials: { label1: 'Phone', value1: '250788100001', label2: 'PIN', value2: '1234' },
      dashboard: '/consumer/shop',
    },
    {
      id: 'retailer',
      title: 'Retailer',
      subtitle: 'Manage Your Shop',
      description: 'POS system, inventory management, order from wholesalers',
      icon: <StoreIcon />,
      gradient: 'from-blue-500 to-indigo-600',
      hoverGradient: 'hover:from-blue-600 hover:to-indigo-700',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
      features: ['POS System', 'Inventory', 'Wholesaler Orders', 'NFC Management'],
      authType: 'email',
      credentials: { label1: 'Email', value1: 'retailer@bigcompany.rw', label2: 'Password', value2: 'retailer123' },
      dashboard: '/retailer/dashboard',
    },
    {
      id: 'wholesaler',
      title: 'Wholesaler',
      subtitle: 'Distribution Hub',
      description: 'Manage retailers, process bulk orders, credit approvals',
      icon: <TruckIcon />,
      gradient: 'from-purple-500 to-violet-600',
      hoverGradient: 'hover:from-purple-600 hover:to-violet-700',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600',
      features: ['Retailer Network', 'Bulk Orders', 'Credit Management', 'Analytics'],
      authType: 'email',
      credentials: { label1: 'Email', value1: 'wholesaler@bigcompany.rw', label2: 'Password', value2: 'wholesaler123' },
      dashboard: '/wholesaler/dashboard',
    },
  ];

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      title: 'Digital Wallets',
      description: 'Secure mobile payments with instant transfers between consumers, retailers, and wholesalers.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: 'NFC Cards',
      description: 'Tap-to-pay contactless cards for consumers. Issue and manage cards for your customers.',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Real-time Analytics',
      description: 'Track sales, inventory, and customer behavior with beautiful dashboards and reports.',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'B2B Distribution',
      description: 'Streamlined ordering between retailers and wholesalers with credit management.',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: '30 Districts',
      description: 'Complete coverage across all of Rwanda with district-level analytics and management.',
      gradient: 'from-indigo-500 to-purple-500',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Secure Platform',
      description: 'Bank-grade security with encrypted transactions and multi-factor authentication.',
      gradient: 'from-rose-500 to-pink-500',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-x-hidden">
      <FloatingParticles />

      {/* SVG filter to remove black background from logo */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="remove-black-bg">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    2 2 2 0 -0.05"
          />
        </filter>
      </svg>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="py-4 px-6 sticky top-0 z-50 bg-slate-950/40 backdrop-blur-xl border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-40 h-16 overflow-hidden flex items-center justify-center relative cursor-pointer" onClick={() => navigate('/')}>
              <img
                src="/logo-big-black.png"
                alt="BIG Logo"
                className="w-36 h-36 object-contain"
                style={{
                  filter: 'url(#remove-black-bg) brightness(1.2) contrast(1.2)',
                }}
              />
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            {['Home', 'About', 'Services', 'News', 'Contact'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const portalSection = document.getElementById('portals');
                portalSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white/5 text-white px-4 py-2 rounded-lg text-sm font-semibold border border-white/10 transition-all"
            >
              Go to Dashboard
            </motion.button>
            {isAuthenticated && user ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePortalClick(user.role)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-purple-500/20"
              >
                Dashboard
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-lg text-sm font-semibold backdrop-blur-sm border border-white/20"
              >
                Sign In
              </motion.button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section id="home" className="py-24 px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block mb-8 px-5 py-2.5 rounded-full bg-blue-500/10 backdrop-blur-md border border-blue-500/20"
          >
            <span className="text-blue-300 text-sm font-semibold tracking-wider uppercase">
              Advancing Rwanda Through Innovation & Technology
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-8xl font-black text-white mb-8 leading-[1.1] tracking-tight">
            Big Innovation Group Ltd
          </h1>

          <p className="text-lg md:text-2xl text-gray-400 max-w-4xl mx-auto mb-12 font-medium leading-relaxed">
            <span className="text-white block mb-4 italic text-3xl font-light">"Smart Living Simplified"</span>
            A leading Rwandan technology conglomerate transforming digital distribution,
            retail connectivity, and <strong>clean cooking through LPG solutions</strong>.
          </p>

          <div className="flex flex-wrap justify-center gap-5">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const servicesSection = document.getElementById('services');
                servicesSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 flex items-center gap-2"
            >
              Explore Our Services
              <ArrowRightIcon />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/10"
            >
              Watch Company Vision
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* About Section (Company Overview) */}
      <section id="about" className="py-24 px-4 relative z-10 border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-4">
                <InfoIcon className="w-4 h-4" />
                Our Story
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                About <span className="text-orange-500">Big Innovation Group Ltd</span>
              </h2>

              <div className="space-y-6 text-lg text-gray-400 leading-relaxed">
                <p>
                  <strong className="text-white">Big Innovation Group Ltd</strong> is a Rwanda-based innovation company founded in 2023. The company was established with a vision to promote digital transformation across Africa by developing practical solutions that support digital sales, smart agriculture, clean cooking adoption, environmental protection, and efficient distribution systems.
                </p>
                <p>
                  Located at <strong className="text-white">KK39 Ave, Kigali, Rwanda</strong>, Big Innovation Group Ltd focuses on building technology-driven platforms that connect customers, retailers, and wholesalers through organized account management, digital wallet services, NFC card access, product ordering, inventory visibility, and transaction monitoring.
                </p>
                <p>
                  Through its digital distribution platform, the company aims to improve access to products and services, strengthen supply chain visibility, support business growth for retailers and wholesalers, and create a more transparent and efficient marketplace. In addition, Big Innovation Group Ltd promotes clean cooking solutions as part of its commitment to environmental protection, reduced household pollution, and sustainable community development.
                </p>
                <p className="italic border-l-4 border-orange-500 pl-6 py-2 bg-white/5 rounded-r-xl">
                  The company’s mission is to use innovation and technology to solve real market challenges while contributing to Africa’s digital economy, sustainable agriculture, and cleaner energy future.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 text-center flex-1 min-w-[140px]">
                  <p className="text-3xl font-bold text-white mb-1">2023</p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Founded</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 text-center flex-1 min-w-[140px]">
                  <p className="text-3xl font-bold text-white mb-1">Africa</p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Our Vision</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 text-center flex-1 min-w-[140px]">
                  <p className="text-3xl font-bold text-white mb-1">Digital</p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Transformation</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative lg:mt-20"
            >
              <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1200"
                  alt="Company Innovation"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <div className="text-center">
                  <div className="text-white font-bold text-2xl">100%</div>
                  <div className="text-white/70 text-[10px] uppercase font-bold tracking-widest">Rwandan</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Animated Stats Section */}
      <section className="py-16 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              { value: 547, label: 'Active Retailers', suffix: '+', prefix: '' },
              { value: 12500, label: 'Products Listed', suffix: '+', prefix: '' },
              { value: 30, label: 'Districts Covered', suffix: '', prefix: '' },
              { value: 2800000, label: 'Monthly GMV', suffix: '', prefix: 'RWF ' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  <AnimatedCounter
                    end={stat.value}
                    suffix={stat.suffix}
                    prefix={stat.prefix}
                    duration={2500}
                  />
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Powerful Dashboard Analytics
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Real-time insights into your business with beautiful visualizations
            </p>
          </motion.div>

          {/* Tab Switcher */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/5 backdrop-blur-lg rounded-full p-1 border border-white/10">
              {['wholesaler', 'retailer', 'consumer'].map((tab) => (
                <motion.button
                  key={tab}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === tab
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Dashboard Preview */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 md:p-8 border border-white/10"
          >
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Main Chart */}
              <div className="md:col-span-2 bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-white font-semibold text-lg">Revenue Overview</h3>
                    <p className="text-gray-400 text-sm">Monthly sales performance</p>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="font-semibold">+24.5%</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#667eea"
                      strokeWidth={3}
                      fill="url(#salesGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Side Charts */}
              <div className="space-y-6">
                {/* Pie Chart */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-4">Categories</h3>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {categoryData.map((cat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-gray-400">{cat.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-4">Today's Activity</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Orders</span>
                      <span className="text-white font-semibold">847</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Revenue</span>
                      <span className="text-emerald-400 font-semibold">1.2M RWF</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">New Retailers</span>
                      <span className="text-blue-400 font-semibold">+12</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-semibold mb-4">Top Districts by Sales</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={districtData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" fill="#667eea" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Line Chart */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-semibold mb-4">Real-time Transactions</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={realtimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="transactions"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-24 px-4 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Integrated Business Solutions
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto text-lg leading-relaxed">
              We leverage advanced technology to streamline complex business operations
              and drive economic growth across Rwanda.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                title: "LPG & Clean Cooking",
                description: "Promoting sustainable energy through smart LPG distribution and automated gas metering for Rwandan households.",
                icon: features[1].icon,
                gradient: "from-indigo-600 to-purple-600"
              },
              {
                title: "Free Gas Program",
                description: "Loyalty-based 'Free Gas' rewards for our consistent customers, making clean energy affordable for everyone.",
                icon: features[5].icon,
                gradient: "from-orange-600 to-amber-600"
              },
              {
                title: "Wholesaler Management",
                description: "Comprehensive tools for wholesaler networks to manage retailers, bulk orders, and credit approvals.",
                icon: features[3].icon,
                gradient: "from-blue-600 to-indigo-600"
              },
              {
                title: "Real-time Monitoring",
                description: "Advanced transaction monitoring and analytics to track distribution and sales across all 30 districts.",
                icon: features[2].icon,
                gradient: "from-pink-600 to-rose-600"
              },
              {
                title: "Digital Wallets & NFC",
                description: "Seamless wallet-based purchasing and tap-to-pay NFC card technology for instant, secure transactions.",
                icon: features[0].icon,
                gradient: "from-purple-600 to-pink-600"
              },
              {
                title: "Enterprise Solutions",
                description: "Bank-grade security and decentralized data management ensuring absolute business continuity and growth.",
                icon: features[4].icon,
                gradient: "from-rose-600 to-orange-600"
              }
            ].map((service, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ scale: 1.03, y: -5 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-blue-500/30 hover:bg-white/10 transition-all duration-500 group"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center text-white mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  {service.icon}
                </div>
                <h3 className="text-white text-2xl font-bold mb-4">{service.title}</h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{service.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* News & Insights Section */}
      <section id="news" className="py-24 px-4 relative z-10 border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">News & Insights</h2>
              <p className="text-gray-400 text-lg">Stay updated with our latest innovations and corporate announcements.</p>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => message.info('More news and insights are being prepared!')}
              className="text-blue-400 font-semibold flex items-center gap-2 hover:text-blue-300 transition-colors"
            >
              View All News <ArrowRightIcon />
            </motion.button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {(newsPosts.length > 0 ? newsPosts : [
              {
                title: "Expanding Our Digital Footprint in Western Province",
                publishedAt: "2024-05-10",
                shortDescription: "Corporate expansion news",
                image: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&q=80&w=800",
              },
              {
                title: "New Smart Gas Metering Partnership Announced",
                publishedAt: "2024-05-05",
                shortDescription: "Innovation update",
                image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800",
              },
              {
                title: "How Digital Wallets are Transforming Rural Retail",
                publishedAt: "2024-04-28",
                shortDescription: "Industry insights",
                image: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=800",
              }
            ]).slice(0, 3).map((post, idx) => (
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
                className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 group cursor-pointer h-full flex flex-col"
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
                      {dayjs(post.publishedAt || post.date).format('MMM DD, YYYY')}
                    </span>
                  </div>
                  <h3 className="text-white text-xl font-bold mb-4 group-hover:text-blue-400 transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-grow">
                    {post.shortDescription || post.blogText?.substring(0, 100) + '...'}
                  </p>
                  <div className="flex items-center gap-2 text-blue-400 text-sm font-medium group-hover:text-white transition-colors mt-auto">
                    Read More <ArrowRightIcon />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
                    {dayjs(selectedPost.publishedAt || selectedPost.date).format('MMMM DD, YYYY')}
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

      {/* Portal Cards Section */}
      <section id="portals" className="py-24 px-4 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Choose Your Portal
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Select your role to access the appropriate dashboard with demo credentials
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6 lg:gap-8"
          >
            {portals.map((portal, idx) => (
              <motion.div
                key={portal.id}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300"
              >
                {/* Card Header */}
                <div className={`bg-gradient-to-r ${portal.gradient} p-6 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                      <motion.div
                        whileHover={{ rotate: 10 }}
                        className="bg-white/20 rounded-xl p-3"
                      >
                        {portal.icon}
                      </motion.div>
                      <div>
                        <h3 className="text-2xl font-bold">{portal.title}</h3>
                        <p className="text-white/80">{portal.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-white/90">{portal.description}</p>
                  </div>
                </div>

                {/* Features */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {portal.features.map((feature, fidx) => (
                      <div key={fidx} className="flex items-center gap-2 text-gray-300 text-sm">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: idx * 0.1 + fidx * 0.05 }}
                          className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${portal.gradient}`}
                        />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* Demo Credentials */}
                  <div className={`${portal.bgLight} rounded-xl p-4 mb-6`}>
                    <p className={`${portal.textColor} font-semibold text-sm mb-3`}>Demo Credentials</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-white rounded-lg px-3 py-2">
                        <span className="text-gray-500 text-xs">{portal.credentials.label1}:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-gray-800">{portal.credentials.value1}</code>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(portal.credentials.value1, `${portal.id}-1`);
                            }}
                            className={`p-1 rounded ${portal.bgLight} hover:opacity-70`}
                          >
                            {copiedField === `${portal.id}-1` ? <CheckIcon /> : <CopyIcon />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-white rounded-lg px-3 py-2">
                        <span className="text-gray-500 text-xs">{portal.credentials.label2}:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-gray-800">{portal.credentials.value2}</code>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(portal.credentials.value2, `${portal.id}-2`);
                            }}
                            className={`p-1 rounded ${portal.bgLight} hover:opacity-70`}
                          >
                            {copiedField === `${portal.id}-2` ? <CheckIcon /> : <CopyIcon />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePortalClick(portal.id)}
                    className={`w-full bg-gradient-to-r ${portal.gradient} ${portal.hoverGradient} text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/20`}
                  >
                    {isAuthenticated && user?.role === portal.id ? (
                      <>Go to Dashboard</>
                    ) : (
                      <>Access {portal.title} Portal</>
                    )}
                    <ArrowRightIcon />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-lg rounded-3xl p-12 text-center border border-white/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Distribution?
              </h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Join hundreds of businesses already using Big Innovation Group Ltd platform to streamline their operations and grow revenue.
              </p>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(102, 126, 234, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login?role=wholesaler')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-10 rounded-xl transition-all duration-300"
              >
                Get Started Today
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>



      {/* Footer */}
      <footer id="contact" className="py-20 px-4 relative z-10 border-t border-white/5 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-40 h-16 overflow-hidden flex items-center justify-center relative">
                  <img
                    src="/logo-big-black.png"
                    alt="BIG Logo"
                    className="w-36 h-36 object-contain"
                    style={{
                      filter: 'url(#remove-black-bg) brightness(1.2) contrast(1.2)',
                    }}
                  />
                </div>
              </div>
              <p className="text-gray-400 mb-8 max-w-md leading-relaxed">
                Empowering businesses and communities in Rwanda through
                transformative technology and sustainable innovation platforms.
                <span className="block mt-4 text-orange-500 font-semibold italic text-sm">"Smart Living Simplified"</span>
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Quick Links</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#home" className="hover:text-blue-400 transition-colors">Home</a></li>
                <li><a href="#about" className="hover:text-blue-400 transition-colors">About Us</a></li>
                <li><a href="#services" className="hover:text-blue-400 transition-colors">Services</a></li>
                <li><a href="#news" className="hover:text-blue-400 transition-colors">News & Insights</a></li>
                <li><button
                  onClick={() => document.getElementById('portals')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:text-blue-400 transition-colors"
                >
                  Portal Access
                </button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Contact Us</h4>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span>KK39 Ave, Kigali, Rwanda</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>info@big.co.rw</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+250788541239</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Big Innovation Group Ltd. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
