'use client';

import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Timer, ArrowDown, ArrowUp, Activity, Play, RotateCw, AlertTriangle } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

type TestResult = {
  id: number;
  date: string;
  ping: number;
  jitter: number;
  download: number;
  upload: number;
};

type Status = 'idle' | 'testing-ping' | 'testing-download' | 'testing-upload' | 'finished' | 'error';

const AnimatedNumber = ({ value, duration = 1500 }: { value: number, duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;

    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      setDisplayValue(startValue + (value - startValue) * progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span>{displayValue.toFixed(0)}</span>;
};


export default function SpeedTestPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<TestResult | null>(null);
  const [history, setHistory] = useState<TestResult[]>([]);
  const [displayValues, setDisplayValues] = useState({ ping: 0, jitter: 0, download: 0, upload: 0 });
  const [errorMessage, setErrorMessage] = useState('');

  const runTest = useCallback(async () => {
    setStatus('testing-ping');
    setResults(null);
    setDisplayValues({ ping: 0, jitter: 0, download: 0, upload: 0 });
    setErrorMessage('');

    try {
      // --- PING & JITTER TEST ---
      const pings: number[] = [];
      const pingCount = 5;
      for (let i = 0; i < pingCount; i++) {
        const startTime = Date.now();
        await fetch('/api/speed-test/ping', { cache: 'no-store' });
        const endTime = Date.now();
        pings.push(endTime - startTime);
        await new Promise(res => setTimeout(res, 300));
      }
      const avgPing = Math.round(pings.reduce((a, b) => a + b, 0) / pingCount);
      const jitter = Math.round(pings.slice(1).reduce((acc, current, i) => acc + Math.abs(current - pings[i]), 0) / (pingCount - 1));
      setDisplayValues(prev => ({ ...prev, ping: avgPing, jitter: jitter }));
      
      setStatus('testing-download');

      // --- DOWNLOAD TEST ---
      const downloadStartTime = Date.now();
      const downloadResponse = await fetch('/api/speed-test/download', { cache: 'no-store' });
      const downloadSize = Number(downloadResponse.headers.get('Content-Length'));
      await downloadResponse.blob();
      const downloadEndTime = Date.now();
      const downloadDuration = (downloadEndTime - downloadStartTime) / 1000;
      const downloadSpeed = (downloadSize * 8) / downloadDuration / 1_000_000;
      setDisplayValues(prev => ({...prev, download: downloadSpeed }));

      setStatus('testing-upload');

      // --- UPLOAD TEST ---
      const uploadSize = 10 * 1024 * 1024; // 10MB
      const uploadData = new Blob([new Uint8Array(uploadSize)], { type: 'application/octet-stream' });
      const uploadStartTime = Date.now();
      await fetch('/api/speed-test/upload', { method: 'POST', body: uploadData, cache: 'no-store' });
      const uploadEndTime = Date.now();
      const uploadDuration = (uploadEndTime - uploadStartTime) / 1000;
      const uploadSpeed = (uploadSize * 8) / uploadDuration / 1_000_000;
      setDisplayValues(prev => ({...prev, upload: uploadSpeed }));

      // --- FINISH ---
      setStatus('finished');
      const newResult: TestResult = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        ping: avgPing,
        jitter: jitter,
        download: Math.round(downloadSpeed),
        upload: Math.round(uploadSpeed),
      };
      setResults(newResult);
      setHistory(prev => [newResult, ...prev.slice(0, 9)]);

    } catch (error) {
      console.error("Speed test failed:", error);
      setStatus('error');
      setErrorMessage('The speed test failed. Check your connection.');
    }
  }, []);
  
  const getStatusText = () => {
    switch (status) {
      case 'testing-ping': return 'Testing Ping & Jitter...';
      case 'testing-download': return 'Testing Download Speed...';
      case 'testing-upload': return 'Testing Upload Speed...';
      case 'finished': return 'Test Complete';
      case 'error': return errorMessage;
      default: return 'Ready to Test';
    }
  };

  const isTesting = status.startsWith('testing');

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Speed Test</h1>
          <p className="text-muted-foreground">
            Measure your internet connection's speed and latency.
          </p>
        </div>
        
        <Card className="relative overflow-hidden shadow-lg">
          <CardContent className="p-6 flex flex-col items-center justify-center space-y-6 min-h-[300px]">
             <div className="flex flex-wrap justify-center gap-4 md:gap-8 w-full text-center">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Ping</div>
                    <div className="text-2xl font-bold">{status !== 'idle' ? displayValues.ping.toFixed(0) : '-'} <span className="text-sm font-normal">ms</span></div>
                  </div>
                </div>
                 <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Jitter</div>
                    <div className="text-2xl font-bold">{status !== 'idle' ? displayValues.jitter.toFixed(0) : '-'} <span className="text-sm font-normal">ms</span></div>
                  </div>
                </div>
                 <div className="flex items-center gap-2">
                  <ArrowDown className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Download</div>
                    <div className="text-2xl font-bold">
                      {status !== 'idle' && status !== 'testing-ping' ? <AnimatedNumber value={displayValues.download} /> : '-'}
                      <span className="text-sm font-normal"> Mbps</span>
                    </div>
                  </div>
                </div>
                 <div className="flex items-center gap-2">
                  <ArrowUp className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Upload</div>
                    <div className="text-2xl font-bold">
                       {status === 'testing-upload' || status === 'finished' ? <AnimatedNumber value={displayValues.upload} /> : '-'}
                      <span className="text-sm font-normal"> Mbps</span>
                    </div>
                  </div>
                </div>
            </div>
            
            <Button
              size="lg"
              className="w-48 h-16 rounded-full text-2xl font-bold shadow-lg bg-primary hover:bg-primary/90 disabled:opacity-50"
              onClick={runTest}
              disabled={isTesting}
            >
              {status === 'idle' || status === 'finished' || status === 'error' ? (
                <>{status === 'finished' || status === 'error' ? <RotateCw className="mr-2" /> : <Play className="mr-2" />} {status === 'finished' ? 'Again' : (status === 'error' ? 'Retry' : 'Go')}</>
              ) : (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Testing...</span>
                </div>
              )}
            </Button>
            <p className={`text-muted-foreground h-5 ${status === 'error' ? 'text-destructive' : ''}`}>
              {status === 'error' && <AlertTriangle className="inline-block h-4 w-4 mr-1" />}
              {getStatusText()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test History</CardTitle>
            <CardDescription>
              Your last 10 speed test results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Ping (ms)</TableHead>
                  <TableHead>Jitter (ms)</TableHead>
                  <TableHead>Download (Mbps)</TableHead>
                  <TableHead>Upload (Mbps)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length > 0 ? (
                  history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="hidden md:table-cell">{h.date}</TableCell>
                      <TableCell>{h.ping}</TableCell>
                      <TableCell>{h.jitter}</TableCell>
                      <TableCell>{h.download}</TableCell>
                      <TableCell>{h.upload}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No test history yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
