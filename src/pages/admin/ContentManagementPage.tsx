import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Card,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  message,
  Popconfirm,
  Tabs,
  Tooltip,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  ReadOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { Upload } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ContentManagementPage: React.FC = () => {
  const [news, setNews] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('news');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchContent();
    }
  }, [token]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [newsRes, blogsRes] = await Promise.all([
        axios.get(`${API_URL}/content/news`, config),
        axios.get(`${API_URL}/content/blogs`, config)
      ]);

      setNews(newsRes.data);
      setBlogs(blogsRes.data);
    } catch (error) {
      message.error('Failed to fetch content');
    } finally {
      setLoading(false);
    }
  };

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const endpoint = activeTab === 'news' ? 'news' : 'blogs';

      // Handle image upload
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const base64 = await getBase64(fileList[0].originFileObj as File);
        values.image = base64;
      }

      if (editingItem) {
        await axios.put(`${API_URL}/content/${endpoint}/${editingItem.id}`, values, config);
        message.success(`${activeTab === 'news' ? 'News' : 'Blog'} updated successfully`);
      } else {
        await axios.post(`${API_URL}/content/${endpoint}`, values, config);
        message.success(`${activeTab === 'news' ? 'News' : 'Blog'} created successfully`);
      }

      setIsModalOpen(false);
      form.resetFields();
      setFileList([]);
      setEditingItem(null);
      fetchContent();
    } catch (error) {
      message.error('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const endpoint = activeTab === 'news' ? 'news' : 'blogs';

      await axios.delete(`${API_URL}/content/${endpoint}/${id}`, config);
      message.success('Deleted successfully');
      fetchContent();
    } catch (error) {
      message.error('Delete failed');
    }
  };

  const showModal = (item: any = null) => {
    setEditingItem(item);
    setFileList([]);
    if (item) {
      form.setFieldsValue(item);
      if (item.image) {
        setFileList([
          {
            uid: '-1',
            name: 'current-image.png',
            status: 'done',
            url: item.image,
          },
        ]);
      }
    } else {
      form.resetFields();
      form.setFieldsValue({ status: 'published' });
    }
    setIsModalOpen(true);
  };

  const onUploadChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const commonColumns = [
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      width: 80,
      render: (url: string) => url ? (
        <img src={url} alt="content" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />
      ) : <div style={{ width: 50, height: 50, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><EyeOutlined /></div>,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Author',
      dataIndex: 'author',
      key: 'author',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'published' ? 'green' : 'orange'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Published Date',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
          </Tooltip>
          <Popconfirm
            title="Are you sure to delete this item?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const newsColumns = [
    commonColumns[0],
    commonColumns[1],
    {
      title: 'Description',
      dataIndex: 'shortDescription',
      key: 'shortDescription',
      ellipsis: true,
    },
    ...commonColumns.slice(2),
  ];

  const blogColumns = [
    commonColumns[0],
    commonColumns[1],
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Tag color="blue">{cat}</Tag>,
    },
    ...commonColumns.slice(2),
  ];

  return (
    <div style={{ padding: '0' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Content Management</Title>
          <Typography.Text type="secondary">Manage public website news and blog posts</Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => showModal()}
          style={{ borderRadius: '8px' }}
        >
          Create New {activeTab === 'news' ? 'News' : 'Blog'}
        </Button>
      </div>

      <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'news',
              label: (
                <span>
                  <FileTextOutlined />
                  News Updates
                </span>
              ),
              children: (
                <Table
                  columns={newsColumns}
                  dataSource={news}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 8 }}
                />
              ),
            },
            {
              key: 'blogs',
              label: (
                <span>
                  <ReadOutlined />
                  Blog Posts
                </span>
              ),
              children: (
                <Table
                  columns={blogColumns}
                  dataSource={blogs}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 8 }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={`${editingItem ? 'Edit' : 'Create'} ${activeTab === 'news' ? 'News' : 'Blog'}`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: 'published' }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: 'Please enter title' }]}
              >
                <Input placeholder="Enter catchy title" />
              </Form.Item>
            </Col>
            
            {activeTab === 'blogs' && (
              <Col span={12}>
                <Form.Item
                  name="category"
                  label="Category / Tag"
                >
                  <Input placeholder="e.g. Technology, Digital Growth" />
                </Form.Item>
              </Col>
            )}

            <Col span={activeTab === 'blogs' ? 12 : 24}>
              <Form.Item
                name="author"
                label="Author Name"
              >
                <Input placeholder="Writer name" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="image"
                label="Cover Image"
              >
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  onChange={onUploadChange}
                  beforeUpload={() => false} // Prevent automatic upload
                  maxCount={1}
                >
                  {fileList.length >= 1 ? null : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>

            {activeTab === 'news' && (
              <Col span={24}>
                <Form.Item
                  name="shortDescription"
                  label="Short Summary"
                  rules={[{ required: true, message: 'Please enter short summary' }]}
                >
                  <TextArea rows={2} placeholder="Brief highlight of the news" />
                </Form.Item>
              </Col>
            )}

            <Col span={24}>
              <Form.Item
                name={activeTab === 'news' ? 'fullContent' : 'blogText'}
                label={activeTab === 'news' ? 'Full Content' : 'Blog Body'}
                rules={[{ required: true, message: 'Please enter content' }]}
              >
                <TextArea rows={6} placeholder="Write your full story here..." />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
              >
                <Select>
                  <Option value="published">Published (Visible)</Option>
                  <Option value="hidden">Hidden (Draft)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingItem ? 'Update Content' : 'Publish Now'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContentManagementPage;
