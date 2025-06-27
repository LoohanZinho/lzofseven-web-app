'use client';

import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Timer, ArrowDown, ArrowUp, Activity, Play, RotateCw } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

type TestResult = {
  id: number;
  date: string;
  ping: number;
  jitter: number;
  download: number;
  upload: number;
};

type Status = 'idle' | 'testing-ping' | 'testing-download' | 'testing-upload' | 'finished';

const AnimatedNumber = ({ value, duration = 500 }: { value: number, duration?: number }) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    const startValue = currentValue;
    const endValue = value;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const newDisplayValue = Math.floor(progress * (endValue - startValue) + startValue);
      setCurrentValue(newDisplayValue);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value, duration, currentValue]);

  return <span>{currentValue.toFixed(0)}</span>;
};


export default function SpeedTestPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<TestResult | null>(null);
  const [history, setHistory] = useState<TestResult[]>([]);
  const [displayValues, setDisplayValues] = useState({ ping: 0, jitter: 0, download: 0, upload: 0 });

  const runTest = useCallback(() => {
    setStatus('testing-ping');
    setResults(null);
    setDisplayValues({ ping: 0, jitter: 0, download: 0, upload: 0 });

    const final = {
      ping: Math.floor(Math.random() * 50) + 5,
      jitter: Math.floor(Math.random() * 10) + 1,
      download: Math.floor(Math.random() * 450) + 50,
      upload: Math.floor(Math.random() * 80) + 20,
    };

    // Simulate Ping & Jitter
    setTimeout(() => {
      setDisplayValues(prev => ({ ...prev, ping: final.ping, jitter: final.jitter }));
      setStatus('testing-download');

      // Simulate Download
      setTimeout(() => {
        setDisplayValues(prev => ({...prev, download: final.download }));
        setStatus('testing-upload');
        
        // Simulate Upload
        setTimeout(() => {
          setDisplayValues(prev => ({...prev, upload: final.upload }));
          setStatus('finished');
          const newResult: TestResult = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            ...final,
          };
          setResults(newResult);
          setHistory(prev => [newResult, ...prev.slice(0, 9)]);
        }, 4000);
      }, 4000);
    }, 1500);

  }, []);
  
  const getStatusText = () => {
    switch (status) {
      case 'testing-ping': return 'Testing Ping...';
      case 'testing-download': return 'Testing Download...';
      case 'testing-upload': return 'Testing Upload...';
      case 'finished': return 'Test Complete';
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
                    <div className="text-2xl font-bold">{isTesting || status === 'finished' ? displayValues.ping.toFixed(0) : '-'} <span className="text-sm font-normal">ms</span></div>
                  </div>
                </div>
                 <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Jitter</div>
                    <div className="text-2xl font-bold">{isTesting || status === 'finished' ? displayValues.jitter.toFixed(0) : '-'} <span className="text-sm font-normal">ms</span></div>
                  </div>
                </div>
                 <div className="flex items-center gap-2">
                  <ArrowDown className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Download</div>
                    <div className="text-2xl font-bold">
                      {status === 'testing-download' || status === 'testing-upload' || status === 'finished' ? <AnimatedNumber value={displayValues.download} /> : '-'}
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
              {status === 'idle' || status === 'finished' ? (
                <>{status === 'finished' ? <RotateCw className="mr-2" /> : <Play className="mr-2" />} {status === 'finished' ? 'Again' : 'Go'}</>
              ) : (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Testing...</span>
                </div>
              )}
            </Button>
            <p className="text-muted-foreground h-5">{getStatusText()}</p>
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
