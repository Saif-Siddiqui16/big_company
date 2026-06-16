import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Input, Space, Button, Card, Typography, message, Pagination, Select, Row, Col, Modal, Form, Radio } from 'antd';
import { SearchOutlined, ReloadOutlined, MailOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { adminApi } from '../../services/apiService';

const { Title, Text } = Typography;
const { Option } = Select;

interface EmailLog {
  id: number;
  recipientEmail?: string;
  recipientPhone?: string;
  channel: 'EMAIL' | 'SMS';
  subject?: string;
  templateType: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING' | 'PERMANENT_FAILURE';
  errorMessage?: string;
  messageId?: string;
  retryCount: number;
  relatedEntityType?: string;
  relatedEntityId?: string;
  timestamp: string;
}

const EmailMonitoringPage: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [channelFilter, setChannelFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [isManualModalVisible, setIsManualModalVisible] = useState(false);
  const [sendingManual, setSendingManual] = useState(false);
  const [manualForm] = Form.useForm();
  const [templates, setTemplates] = useState<any[]>([]);
  const [recipientMode, setRecipientMode] = useState<'individual' | 'group'>('individual');

  const fetchTemplates = async () => {
    try {
      const response = await adminApi.getEmailTemplates();
      if (response.data.success) {
        setTemplates(response.data.templates);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getEmailLogs({
        page,
        limit,
        status: statusFilter,
        channel: channelFilter,
        search: search || undefined
      });

      if (response.data.success) {
        setLogs(response.data.logs);
        setTotal(response.data.total);
      }
    } catch (error: any) {
      message.error('Failed to fetch email logs: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleManualSend = async () => {
    try {
      const values = await manualForm.validateFields();
      setSendingManual(true);
      
      const payload: any = {
        subject: values.subject,
        html: values.html,
        category: 'MANUAL_ANNOUNCEMENT'
      };

      if (recipientMode === 'individual') {
        payload.recipients = values.recipients.split(',').map((e: string) => e.trim()).filter((e: string) => e);
      } else {
        payload.groups = values.groups;
      }
      
      const response = await adminApi.sendManualEmail(payload);

      if (response.data.success) {
        message.success(response.data.message);
        setIsManualModalVisible(false);
        setRecipientMode('individual');
        manualForm.resetFields();
        fetchLogs();
      }
    } catch (error: any) {
      if (error.name !== 'ValidationError') {
        message.error('Failed to send manual email: ' + (error.response?.data?.error || error.message));
      }
    } finally {
      setSendingManual(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchTemplates();
    
    // Set up auto-refresh every 5 seconds for real-time monitoring
    const interval = setInterval(() => {
      fetchLogs();
    }, 5000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [page, statusFilter, channelFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const handleResend = async (id: number) => {
    try {
      const response = await adminApi.resendEmail(id);
      if (response.data.success) {
        message.success('Email has been queued for resending');
        fetchLogs();
      }
    } catch (error: any) {
      message.error('Failed to resend email: ' + (error.response?.data?.error || error.message));
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'SENT':
        return <Tag color="success" icon={<CheckCircleOutlined />}>SENT</Tag>;
      case 'FAILED':
        return <Tag color="error" icon={<ExclamationCircleOutlined />}>FAILED</Tag>;
      case 'RETRYING':
        return <Tag color="warning" icon={<ClockCircleOutlined />}>RETRYING</Tag>;
      case 'PERMANENT_FAILURE':
        return <Tag color="volcano" icon={<ExclamationCircleOutlined />}>PERMANENT FAILURE</Tag>;
      case 'PENDING':
        return <Tag color="processing" icon={<ClockCircleOutlined />}>PENDING</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      render: (text: string) => (
        <Tag color={text === 'SMS' ? 'purple' : 'cyan'}>{text || 'EMAIL'}</Tag>
      )
    },
    {
      title: 'Recipient',
      key: 'recipient',
      render: (_: any, record: EmailLog) => (
        <Text strong>{record.channel === 'SMS' ? record.recipientPhone : record.recipientEmail}</Text>
      )
    },
    {
      title: 'Subject / Purpose',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
      render: (text: string, record: EmailLog) => text || record.templateType || '-'
    },
    {
      title: 'Type',
      dataIndex: 'templateType',
      key: 'templateType',
      render: (text: string) => <Tag color="blue">{text ? text.replace(/_/g, ' ') : '-'}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Retries',
      dataIndex: 'retryCount',
      key: 'retryCount',
      align: 'center' as const,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: EmailLog) => (
        (record.status === 'FAILED' || record.status === 'PERMANENT_FAILURE') && (
          <Button 
            size="small" 
            type="link" 
            icon={<ReloadOutlined />} 
            onClick={() => handleResend(record.id)}
          >
            Resend
          </Button>
        )
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2}>
            <MailOutlined /> Email Communication Monitoring
          </Title>
          <Text type="secondary">Monitor the health and status of all system-generated emails.</Text>
        </div>
        <Space>
          <Button 
            icon={<MailOutlined />} 
            onClick={() => setIsManualModalVisible(true)}
          >
            Send Announcement
          </Button>
          <Button 
            type="primary" 
            icon={<SettingOutlined />} 
            onClick={() => navigate('/admin/email-templates')}
          >
            Manage Templates
          </Button>
        </Space>
      </div>

      <Modal
        title="Send Manual Announcement"
        open={isManualModalVisible}
        onOk={handleManualSend}
        onCancel={() => {
          setIsManualModalVisible(false);
          setRecipientMode('individual');
          manualForm.resetFields();
        }}
        width={700}
        okText="Send to Queue"
        confirmLoading={sendingManual}
      >
        <Form form={manualForm} layout="vertical">
          <Form.Item 
            name="templateSelect" 
            label="Load from Template (Optional)"
          >
            <Select 
              placeholder="Select a template to auto-fill" 
              allowClear
              onChange={(val) => {
                const template = templates.find((t: any) => t.name === val);
                if (template) {
                  manualForm.setFieldsValue({
                    subject: template.subject,
                    html: template.content
                  });
                }
              }}
            >
              {templates.map((t: any) => (
                <Option key={t.id} value={t.name}>{t.name} - {t.subject}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="recipientMode" 
            label="Recipient Mode"
            initialValue="individual"
          >
            <Radio.Group value={recipientMode} onChange={(e) => setRecipientMode(e.target.value)}>
              <Radio value="individual">Individual Mode</Radio>
              <Radio value="group">Group Mode</Radio>
            </Radio.Group>
          </Form.Item>

          {recipientMode === 'individual' ? (
            <Form.Item 
              name="recipients" 
              label="Recipients (Comma separated emails)" 
              rules={[{ required: true, message: 'Please enter at least one recipient' }]}
            >
              <Input placeholder="e.g., customer@gmail.com, retailer@yahoo.com" />
            </Form.Item>
          ) : (
            <Form.Item 
              name="groups" 
              label="User Groups" 
              rules={[{ required: true, message: 'Please select at least one group' }]}
            >
              <Select 
                mode="multiple" 
                placeholder="Select user groups" 
                allowClear
              >
                <Option value="Customers">Customers</Option>
                <Option value="Retailers">Retailers</Option>
                <Option value="Wholesalers">Wholesalers</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item 
            name="subject" 
            label="Email Subject" 
            rules={[{ required: true, message: 'Please enter a subject' }]}
          >
            <Input placeholder="System Maintenance Alert" />
          </Form.Item>
          <Form.Item 
            name="html" 
            label="HTML Content" 
            rules={[{ required: true, message: 'Please enter content' }]}
          >
            <Input.TextArea rows={8} placeholder="<h1>Important Update</h1><p>Our systems will be...</p>" />
          </Form.Item>
        </Form>
      </Modal>

      <Card style={{ marginTop: '24px' }}>
        <Space style={{ marginBottom: '24px' }} wrap>
          <Input
            placeholder="Search by recipient, subject or purpose..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 300 }}
          />
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 180 }}
            onChange={setStatusFilter}
          >
            <Option value="PENDING">Pending</Option>
            <Option value="SENT">Sent</Option>
            <Option value="RETRYING">Retrying</Option>
            <Option value="FAILED">Failed</Option>
            <Option value="PERMANENT_FAILURE">Permanent Failure</Option>
          </Select>
          <Select
            placeholder="Filter by channel"
            allowClear
            style={{ width: 160 }}
            onChange={setChannelFilter}
          >
            <Option value="EMAIL">Email</Option>
            <Option value="SMS">SMS</Option>
          </Select>
          <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
            Search
          </Button>
          <Button onClick={() => { setSearch(''); setStatusFilter(undefined); setChannelFilter(undefined); setPage(1); fetchLogs(); }} icon={<ReloadOutlined />}>
            Reset
          </Button>
        </Space>

        <Table
          dataSource={logs}
          columns={columns}
          loading={loading}
          pagination={false}
          rowKey="id"
          expandable={{
            expandedRowRender: (record: EmailLog) => (
              <div style={{ padding: '10px 20px', background: '#f9fafb', borderRadius: '8px' }}>
                <Row gutter={24}>
                  <Col span={12}>
                    <Text strong>Log Details:</Text>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">Message ID:</Text> <Text code>{record.messageId || 'N/A'}</Text>
                    </div>
                    <div>
                      <Text type="secondary">Timestamp:</Text> <Text>{new Date(record.timestamp).toLocaleString()}</Text>
                    </div>
                    {record.relatedEntityType && (
                      <div>
                        <Text type="secondary">Linked Entity:</Text> <Text>{record.relatedEntityType} ({record.relatedEntityId})</Text>
                      </div>
                    )}
                  </Col>
                  <Col span={12}>
                    <Text strong>Status Info:</Text>
                    <div style={{ marginTop: 8 }}>
                      {record.errorMessage ? (
                        <Text type="danger"><strong>Error:</strong> {record.errorMessage}</Text>
                      ) : (
                        <Text type="success">Email was processed successfully.</Text>
                      )}
                    </div>
                  </Col>
                </Row>
              </div>
            ),
          }}
        />

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <Pagination
            current={page}
            total={total}
            pageSize={limit}
            onChange={(p) => setPage(p)}
            showSizeChanger={false}
          />
        </div>
      </Card>
    </div>
  );
};

export default EmailMonitoringPage;
