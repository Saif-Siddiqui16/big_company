import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Space, Modal } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_URL } from '../../config';

const { Title, Text } = Typography;

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [form] = Form.useForm();

  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingForgot, setIsSendingForgot] = useState(false);

  // Force Password Reset States
  const [showResetModal, setShowResetModal] = useState(false);
  const [tempPasswordUsed, setTempPasswordUsed] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Demo credentials for admin
  const demoCredentials = {
    email: '',
    password: '',
  };

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      // Try real backend authentication first
      const res = await login(
        { email: values.email, password: values.password },
        'admin'
      );

      if (res && res.require_password_reset) {
        setTempPasswordUsed(values.password);
        setShowResetModal(true);
        message.warning('Temporary password matched! Please set a new password.');
        return;
      }

      message.success('Admin login successful!');
      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Admin login error:', error);
      message.error(error.response?.data?.error || error.message || 'Invalid admin credentials');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setIsSendingForgot(true);
    try {
      const endpoint = `${API_URL}/admin/auth/forgot-password`;
      await axios.post(endpoint, { email: forgotEmail, role: 'admin', method: 'email' });
      message.success('Temporary password has been sent to your email.');
      setShowForgotModal(false);
      setForgotEmail('');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to send temporary password. Please check your email.');
    } finally {
      setIsSendingForgot(false);
    }
  };

  const handleForceResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      message.error('Passwords do not match');
      return;
    }
    setIsResettingPassword(true);
    try {
      const token = sessionStorage.getItem('bigcompany_token') || localStorage.getItem('bigcompany_token');
      const endpoint = `${API_URL}/admin/auth/update-password`;
      await axios.put(
        endpoint,
        { old_password: tempPasswordUsed, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Password updated successfully! Welcome to your dashboard.');
      setShowResetModal(false);
      navigate('/admin/dashboard');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to update password. Please try again.');
    } finally {
      setIsResettingPassword(false);
    }
  };



  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5222d 0%, #722ed1 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: 400,
          borderRadius: 16,
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 120,
              height: 120,
              background: 'white',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              overflow: 'hidden',
              border: '1px solid #f0f0f0'
            }}
          >
            <img src="/logo-big.png" alt="BIG" style={{ height: 110, width: 'auto', objectFit: 'contain' }} />
          </div>
          <Title level={2} style={{ margin: 0, color: '#f5222d' }}>
            Admin Portal
          </Title>
          <Text type="secondary">Big Innovation Group Ltd - Administration</Text>
        </div>



        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          initialValues={demoCredentials}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Admin Email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button type="link" onClick={() => setShowForgotModal(true)} style={{ padding: 0, height: 'auto', color: '#722ed1' }}>
              Forgot password?
            </Button>
          </div>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={isLoading}
              style={{
                background: 'linear-gradient(90deg, #f5222d, #722ed1)',
                border: 'none',
                height: 48,
              }}
            >
              Sign in as Admin
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Button type="link" onClick={() => navigate('/')}>
            ← Back to Home
          </Button>
        </div>
      </Card>

      {/* Forgot Password Modal */}
      <Modal
        title={<Title level={4} style={{ margin: 0 }}>Forgot Password?</Title>}
        open={showForgotModal}
        onCancel={() => setShowForgotModal(false)}
        footer={null}
        destroyOnClose
      >
        <p style={{ color: '#595959', marginBottom: 20 }}>
          Enter your admin email address and we will send you a temporary password to regain access to your account.
        </p>
        <Form onFinish={() => {
          const mockEvent = { preventDefault: () => {} } as React.FormEvent;
          handleForgotPasswordSubmit(mockEvent);
        }} layout="vertical">
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input 
              placeholder="admin@big.co.rw" 
              value={forgotEmail} 
              onChange={(e) => setForgotEmail(e.target.value)} 
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSendingForgot}
            block
            style={{ background: '#722ed1', borderColor: '#722ed1', marginTop: 10 }}
          >
            Send Temporary Password
          </Button>
        </Form>
      </Modal>

      {/* Force Password Reset Modal */}
      <Modal
        title={<Title level={4} style={{ margin: 0, color: '#f5222d' }}>Change Password</Title>}
        open={showResetModal}
        closable={false}
        maskClosable={false}
        footer={null}
        destroyOnClose
      >
        <p style={{ color: '#595959', marginBottom: 20 }}>
          You are logging in with a temporary password. Please set a secure new password to continue.
        </p>
        <Form onFinish={() => {
          const mockEvent = { preventDefault: () => {} } as React.FormEvent;
          handleForceResetSubmit(mockEvent);
        }} layout="vertical">
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[{ required: true, message: 'Please enter new password' }]}
          >
            <Input.Password 
              placeholder="New password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
            />
          </Form.Item>
          <Form.Item
            name="confirmNewPassword"
            label="Confirm New Password"
            rules={[{ required: true, message: 'Please confirm your new password' }]}
          >
            <Input.Password 
              placeholder="Confirm new password" 
              value={confirmNewPassword} 
              onChange={(e) => setConfirmNewPassword(e.target.value)} 
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isResettingPassword}
            block
            style={{ background: 'linear-gradient(90deg, #f5222d, #722ed1)', border: 'none', marginTop: 10 }}
          >
            Update Password & Login
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminLoginPage;
