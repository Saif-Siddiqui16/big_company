import React, { useEffect, useState } from 'react';
import { Alert, Button, message } from 'antd';
import { adminApi } from '../../services/apiService';
import dayjs from 'dayjs';

interface SystemAlert {
  id: number;
  apiName: string;
  status: string;
  failureTime: string;
  resolvedTime?: string;
  errorMessage?: string;
}

export const SystemAlertsBanner: React.FC = () => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  const fetchAlerts = async () => {
    try {
      const res = await adminApi.getSystemAlerts();
      if (res.data.success) {
        // Only show active (failed) alerts
        setAlerts(res.data.alerts.filter((a: SystemAlert) => a.status === 'failed'));
      }
    } catch (error) {
      console.error('Failed to fetch system alerts', error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const acknowledgeAlert = async (id: number) => {
    try {
      await adminApi.acknowledgeAlert(id);
      message.success('Alert acknowledged');
      fetchAlerts();
    } catch (error) {
      message.error('Failed to acknowledge alert');
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          message={`CRITICAL SERVICE FAILURE: ${alert.apiName} is DOWN`}
          description={
            <div>
              <p style={{ margin: 0 }}>Failure Time: {dayjs(alert.failureTime).format('YYYY-MM-DD HH:mm:ss')}</p>
              <p style={{ margin: 0 }}>Error: {alert.errorMessage}</p>
            </div>
          }
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          action={
            <Button size="small" type="primary" danger onClick={() => acknowledgeAlert(alert.id)}>
              Acknowledge / Mark Resolved
            </Button>
          }
        />
      ))}
    </div>
  );
};
