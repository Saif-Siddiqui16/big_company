import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Row, Col, Statistic, message } from 'antd';
import { ContainerOutlined, DollarOutlined } from '@ant-design/icons';
import { wholesalerApi } from '../../services/apiService';

const { Title, Text } = Typography;

const WholesalerTaxManagementPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalOrders: 0, totalTax: 0 });
    const [history, setHistory] = useState([]);

    const fetchTaxes = async () => {
        try {
            setLoading(true);
            const res = await wholesalerApi.getWholesalerTaxes();
            if (res.data?.success) {
                setStats({
                    totalOrders: res.data.data.totalOrders,
                    totalTax: res.data.data.totalTax
                });
                setHistory(res.data.data.history);
            }
        } catch (error) {
            console.error('Failed to fetch taxes:', error);
            message.error('Failed to load tax data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTaxes();
    }, []);

    const columns = [
        {
            title: 'Customer Name',
            dataIndex: 'customerName',
            key: 'customerName',
            render: (val: string) => <Text strong>{val}</Text>
        },
        {
            title: 'Order ID',
            dataIndex: 'id',
            key: 'id',
            render: (val: string) => <Text>#{val}</Text>
        },
        {
            title: 'Order Amount (RWF)',
            dataIndex: 'orderAmount',
            key: 'orderAmount',
            render: (val: number) => <Text>{val?.toLocaleString()}</Text>
        },
        {
            title: 'Tax Paid (RWF)',
            dataIndex: 'taxPaid',
            key: 'taxPaid',
            render: (val: number) => <Text style={{ color: '#ef4444' }}>{val?.toLocaleString()}</Text>
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val: string) => new Date(val).toLocaleDateString()
        }
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
                <Title level={2} style={{ margin: 0, color: '#1f2937' }}>Tax Management</Title>
                <Text type="secondary">Track VAT and excise duties collected from your retailer orders.</Text>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12}>
                    <Card className="shadow-sm rounded-xl" bodyStyle={{ padding: '20px' }}>
                        <Statistic 
                            title={<Text strong style={{ color: '#6b7280' }}>Total Orders</Text>}
                            value={stats.totalOrders}
                            prefix={<ContainerOutlined style={{ color: '#3b82f6', marginRight: '8px' }} />}
                            valueStyle={{ color: '#1f2937', fontWeight: 600, marginTop: '8px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12}>
                    <Card className="shadow-sm rounded-xl" bodyStyle={{ padding: '20px' }}>
                        <Statistic 
                            title={<Text strong style={{ color: '#6b7280' }}>Total Tax Accumulated (RWF)</Text>}
                            value={stats.totalTax}
                            precision={2}
                            prefix={<DollarOutlined style={{ color: '#ef4444', marginRight: '8px' }} />}
                            valueStyle={{ color: '#ef4444', fontWeight: 600, marginTop: '8px' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title="Recent Tax History" className="shadow-sm rounded-xl overflow-hidden" bodyStyle={{ padding: 0 }}>
                <Table
                    columns={columns}
                    dataSource={history}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 15 }}
                />
            </Card>
        </div>
    );
};

export default WholesalerTaxManagementPage;
