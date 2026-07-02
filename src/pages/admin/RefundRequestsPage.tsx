import React, { useState, useEffect } from 'react';
import { Typography, Card, Table, Tag, Button, Space, message, Modal, Input } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { adminApi } from '../../services/apiService';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function RefundRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionModal, setActionModal] = useState<{ visible: boolean, action: 'approve' | 'reject', record: any | null }>({
        visible: false,
        action: 'approve',
        record: null
    });
    const [reason, setReason] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await adminApi.getRefundRequests();
            if (response.data?.success) {
                setRequests(response.data.data);
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to fetch refund requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        if (!actionModal.record) return;
        
        try {
            await adminApi.processRefundRequest(actionModal.record.id, {
                action: actionModal.action,
                reason
            });
            message.success(`Request ${actionModal.action}d successfully`);
            setActionModal({ visible: false, action: 'approve', record: null });
            setReason('');
            fetchRequests();
        } catch (error: any) {
            message.error(error.response?.data?.error || `Failed to ${actionModal.action} request`);
        }
    };

    const columns = [
        {
            title: 'Customer',
            key: 'customer',
            render: (_: any, record: any) => (
                <div>
                    <Text strong>{record.wallet?.consumerProfile?.fullName}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>{record.wallet?.consumerProfile?.user?.phone}</Text>
                </div>
            )
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (val: number) => <Text strong style={{ color: '#ef4444' }}>{val.toLocaleString()} RWF</Text>
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description'
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'date',
            render: (val: string) => new Date(val).toLocaleDateString()
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'pending' ? 'orange' : status === 'approved' ? 'green' : 'red'}>
                    {status.toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: any) => (
                record.status === 'pending' ? (
                    <Space>
                        <Button 
                            type="primary" 
                            size="small" 
                            icon={<CheckCircleOutlined />} 
                            onClick={() => setActionModal({ visible: true, action: 'approve', record })}
                        >
                            Approve
                        </Button>
                        <Button 
                            danger 
                            size="small" 
                            icon={<CloseCircleOutlined />} 
                            onClick={() => setActionModal({ visible: true, action: 'reject', record })}
                        >
                            Reject
                        </Button>
                    </Space>
                ) : null
            )
        }
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <Title level={2} style={{ margin: 0, color: '#1f2937' }}>Refund Requests</Title>
                    <Text type="secondary">Manage customer wallet refund requests.</Text>
                </div>
                <Button onClick={fetchRequests} loading={loading}>Refresh</Button>
            </div>

            <Card className="shadow-sm rounded-xl overflow-hidden" bodyStyle={{ padding: 0 }}>
                <Table
                    columns={columns}
                    dataSource={requests}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={`Confirm ${actionModal.action === 'approve' ? 'Approval' : 'Rejection'}`}
                open={actionModal.visible}
                onOk={handleAction}
                onCancel={() => {
                    setActionModal({ visible: false, action: 'approve', record: null });
                    setReason('');
                }}
                okText={actionModal.action === 'approve' ? 'Approve Refund' : 'Reject Refund'}
                okButtonProps={{ danger: actionModal.action === 'reject' }}
            >
                <p>Are you sure you want to {actionModal.action} this refund request of <strong>{actionModal.record?.amount.toLocaleString()} RWF</strong> for {actionModal.record?.wallet?.consumerProfile?.fullName}?</p>
                
                {actionModal.action === 'approve' && (
                    <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '10px', marginBottom: '20px' }}>
                        Note: Approving this will immediately deduct the amount from the customer's wallet. Ensure you have already sent the funds to them via Mobile Money/Bank.
                    </p>
                )}

                <div style={{ marginTop: '16px' }}>
                    <Text strong>Reason / Note (Optional):</Text>
                    <TextArea 
                        rows={3} 
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)} 
                        placeholder={actionModal.action === 'reject' ? "Please provide a reason for rejection..." : "Add a transaction reference or note..."}
                        style={{ marginTop: '8px' }}
                    />
                </div>
            </Modal>
        </div>
    );
}
