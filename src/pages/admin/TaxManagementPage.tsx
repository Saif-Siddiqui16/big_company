import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Row, Col, Statistic, message, Tabs, Button, Space } from 'antd';
import { ContainerOutlined, DollarOutlined, ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
import { adminApi } from '../../services/apiService';

const { Title, Text } = Typography;

interface TaxHistoryItem {
    id: string;
    customerName: string;
    orderAmount: number;
    taxPaid: number;
    createdAt: string;
}

interface AccountTaxData {
    id: number;
    name: string;
    totalOrders: number;
    totalTax: number;
    history: TaxHistoryItem[];
}

const AdminTaxManagementPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalOrders: 0, totalTax: 0 });
    const [retailers, setRetailers] = useState<AccountTaxData[]>([]);
    const [wholesalers, setWholesalers] = useState<AccountTaxData[]>([]);
    
    // For Detail View
    const [selectedAccount, setSelectedAccount] = useState<AccountTaxData | null>(null);
    const [viewType, setViewType] = useState<'Retailer' | 'Wholesaler' | null>(null);

    const fetchTaxes = async () => {
        try {
            setLoading(true);
            const res = await adminApi.getAdminTaxes();
            if (res.data?.success) {
                setStats({
                    totalOrders: res.data.data.totalOrders,
                    totalTax: res.data.data.totalTax
                });
                setRetailers(res.data.data.retailers || []);
                setWholesalers(res.data.data.wholesalers || []);
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

    const handleViewAccount = (account: AccountTaxData, type: 'Retailer' | 'Wholesaler') => {
        setSelectedAccount(account);
        setViewType(type);
    };

    const handleBack = () => {
        setSelectedAccount(null);
        setViewType(null);
    };

    // Columns for the Accounts List
    const accountColumns = [
        {
            title: 'Shop Name',
            dataIndex: 'name',
            key: 'name',
            render: (val: string) => <Text strong>{val}</Text>
        },
        {
            title: 'Total Orders',
            dataIndex: 'totalOrders',
            key: 'totalOrders',
            render: (val: number) => <Text>{val}</Text>
        },
        {
            title: 'Total Tax Accumulated (RWF)',
            dataIndex: 'totalTax',
            key: 'totalTax',
            render: (val: number) => <Text style={{ color: '#ef4444' }}>{val?.toLocaleString()}</Text>
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: AccountTaxData) => (
                <Button 
                    type="primary" 
                    icon={<EyeOutlined />} 
                    onClick={() => handleViewAccount(record, viewType === 'Wholesaler' ? 'Wholesaler' : 'Retailer')}
                >
                    View
                </Button>
            )
        }
    ];

    // Columns for the individual transaction history (Detail View)
    const historyColumns = [
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
            render: (val: string) => <Text>{val}</Text>
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

    const renderDetailView = () => {
        if (!selectedAccount) return null;
        return (
            <div>
                <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={handleBack} 
                    style={{ marginBottom: '16px' }}
                >
                    Back to List
                </Button>
                <div style={{ marginBottom: '24px' }}>
                    <Title level={3} style={{ margin: 0, color: '#1f2937' }}>{selectedAccount.name} - Tax Management</Title>
                    <Text type="secondary">Detailed view of tax accumulated for this {viewType?.toLowerCase()}.</Text>
                </div>
                
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={12}>
                        <Card className="shadow-sm rounded-xl" bodyStyle={{ padding: '20px' }}>
                            <Statistic 
                                title={<Text strong style={{ color: '#6b7280' }}>Total Orders</Text>}
                                value={selectedAccount.totalOrders}
                                prefix={<ContainerOutlined style={{ color: '#3b82f6', marginRight: '8px' }} />}
                                valueStyle={{ color: '#1f2937', fontWeight: 600, marginTop: '8px' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Card className="shadow-sm rounded-xl" bodyStyle={{ padding: '20px' }}>
                            <Statistic 
                                title={<Text strong style={{ color: '#6b7280' }}>Total Tax Accumulated (RWF)</Text>}
                                value={selectedAccount.totalTax}
                                precision={2}
                                prefix={<DollarOutlined style={{ color: '#ef4444', marginRight: '8px' }} />}
                                valueStyle={{ color: '#ef4444', fontWeight: 600, marginTop: '8px' }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Card title="Recent Tax History" className="shadow-sm rounded-xl overflow-hidden" bodyStyle={{ padding: 0 }}>
                    <Table
                        columns={historyColumns}
                        dataSource={selectedAccount.history}
                        rowKey="id"
                        pagination={{ pageSize: 15 }}
                    />
                </Card>
            </div>
        );
    };

    if (selectedAccount) {
        return <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>{renderDetailView()}</div>;
    }

    const items = [
        {
            key: '1',
            label: 'Retailers',
            children: (
                <Table
                    columns={accountColumns.map(col => col.key === 'action' ? {
                        ...col,
                        render: (_: any, record: AccountTaxData) => (
                            <Button type="primary" icon={<EyeOutlined />} onClick={() => handleViewAccount(record, 'Retailer')}>View</Button>
                        )
                    } : col)}
                    dataSource={retailers}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 15 }}
                />
            ),
        },
        {
            key: '2',
            label: 'Wholesalers',
            children: (
                <Table
                    columns={accountColumns.map(col => col.key === 'action' ? {
                        ...col,
                        render: (_: any, record: AccountTaxData) => (
                            <Button type="primary" icon={<EyeOutlined />} onClick={() => handleViewAccount(record, 'Wholesaler')}>View</Button>
                        )
                    } : col)}
                    dataSource={wholesalers}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 15 }}
                />
            ),
        }
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
                <Title level={2} style={{ margin: 0, color: '#1f2937' }}>Global Tax Management</Title>
                <Text type="secondary">Track VAT and excise duties collected across the entire network.</Text>
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

            <Card className="shadow-sm rounded-xl" bodyStyle={{ padding: '20px' }}>
                <Tabs defaultActiveKey="1" items={items} />
            </Card>
        </div>
    );
};

export default AdminTaxManagementPage;
