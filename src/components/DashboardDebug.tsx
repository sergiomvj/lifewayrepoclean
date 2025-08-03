import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DashboardDebug = () => {
  console.log('DashboardDebug: Componente renderizando...');
  
  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Se você está vendo esta mensagem, o componente básico está funcionando.</p>
          <p>O problema pode estar nos hooks do UnifiedDashboard.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardDebug;
