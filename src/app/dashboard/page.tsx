'use client';

import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, Network, MapPin } from 'lucide-react';

export default function DashboardPage() {
  const connectionInfo = {
    isp: 'Simulated ISP Inc.',
    ipAddress: '192.168.1.100',
    location: 'City, Country',
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your connection.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ISP</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connectionInfo.isp}</div>
              <p className="text-xs text-muted-foreground">
                Your Internet Service Provider
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Public IP Address
              </CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connectionInfo.ipAddress}</div>
              <p className="text-xs text-muted-foreground">(Simulated IPv4)</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Location</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connectionInfo.location}</div>
              <p className="text-xs text-muted-foreground">
                Estimated based on your IP
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="text-center text-sm text-muted-foreground pt-8">
            <p>More tools and features coming soon.</p>
        </div>
      </div>
    </AppLayout>
  );
}
