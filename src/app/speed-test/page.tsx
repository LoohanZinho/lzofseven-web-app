'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Facebook,
  Twitter,
  Link as LinkIcon,
  MoreHorizontal,
  Settings,
  CheckCircle,
  Network,
  Globe,
  User,
  RotateCw
} from 'lucide-react';
import React, { useState, useCallback } from 'react';
import { Gauge } from '@/components/Gauge';

type Status = 'idle' | 'testing-ping' | 'testing-download' | 'testing-upload' | 'finished' | 'error';
type TestType = 'download' | 'upload' | 'ping' | 'idle';

export default function SpeedTestPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [testType, setTestType] = useState<TestType>('idle');
  const [displayValues, setDisplayValues] = useState({ ping: 0, jitter: 0, download: 0, upload: 0 });
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [resultId, setResultId] = useState<string | null>(null);

  const connectionInfo = {
    isp: 'AtualNet',
    ipAddress: '187.85.49.31',
    serverProvider: 'GROOVE TELECOM',
    serverLocation: 'Ananindeua',
    connections: 'Multi',
  };

  const runTest = useCallback(async () => {
    setStatus('testing-ping');
    setTestType('ping');
    setDisplayValues({ ping: 0, jitter: 0, download: 0, upload: 0 });
    setCurrentSpeed(0);
    setErrorMessage('');
    setResultId(null);

    try {
      // --- PING & JITTER TEST ---
      const pings: number[] = [];
      const pingCount = 5;
      for (let i = 0; i < pingCount; i++) {
        const startTime = Date.now();
        await fetch('/api/speed-test/ping', { cache: 'no-store' });
        const endTime = Date.now();
        pings.push(endTime - startTime);
        setDisplayValues(prev => ({ ...prev, ping: endTime - startTime, jitter: prev.jitter }));
        await new Promise(res => setTimeout(res, 200));
      }
      const avgPing = pings.reduce((a, b) => a + b, 0) / pingCount;
      const jitter = pings.slice(1).reduce((acc, current, i) => acc + Math.abs(current - pings[i]), 0) / (pingCount - 1);
      setDisplayValues(prev => ({ ...prev, ping: avgPing, jitter: jitter }));

      // --- DOWNLOAD TEST ---
      setStatus('testing-download');
      setTestType('download');
      setCurrentSpeed(0);

      const downloadResponse = await fetch('/api/speed-test/download', { cache: 'no-store' });
      const downloadSize = Number(downloadResponse.headers.get('Content-Length'));
      if (!downloadResponse.body) throw new Error("Missing response body for download");
      const reader = downloadResponse.body.getReader();
      let receivedLength = 0;
      const downloadStartTime = Date.now();

      const read = async () => {
        try {
          const { done, value } = await reader.read();
          if (done) return;
          
          receivedLength += value.length;
          const duration = (Date.now() - downloadStartTime) / 1000;
          if (duration > 0) {
              const speed = (receivedLength * 8) / duration / 1_000_000;
              setCurrentSpeed(speed);
          }
          await read();
        } catch (e) {
          console.error('Download stream read error:', e);
        }
      };
      await read();
      
      const downloadEndTime = Date.now();
      const downloadDuration = (downloadEndTime - downloadStartTime) / 1000;
      const finalDownloadSpeed = downloadDuration > 0 ? (downloadSize * 8) / downloadDuration / 1_000_000 : 0;
      setCurrentSpeed(finalDownloadSpeed);
      setDisplayValues(prev => ({...prev, download: finalDownloadSpeed }));

      // --- UPLOAD TEST ---
      setStatus('testing-upload');
      setTestType('upload');
      setCurrentSpeed(0);

      await new Promise<void>((resolve, reject) => {
        const uploadSize = 10 * 1024 * 1024; // 10MB
        const uploadData = new Blob([new Uint8Array(uploadSize)], { type: 'application/octet-stream' });
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/speed-test/upload', true);
        const uploadStartTime = Date.now();

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const duration = (Date.now() - uploadStartTime) / 1000;
                if (duration > 0) {
                    const speed = (event.loaded * 8) / duration / 1_000_000;
                    setCurrentSpeed(speed);
                }
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const uploadEndTime = Date.now();
                const uploadDuration = (uploadEndTime - uploadStartTime) / 1000;
                const finalUploadSpeed = uploadDuration > 0 ? (uploadSize * 8) / uploadDuration / 1_000_000 : 0;
                setCurrentSpeed(finalUploadSpeed);
                setDisplayValues(prev => ({ ...prev, upload: finalUploadSpeed }));
                resolve();
            } else {
                reject(new Error(`Upload failed with status: ${xhr.status}`));
            }
        };
        xhr.onerror = () => reject(new Error('Upload failed due to network error.'));
        xhr.send(uploadData);
      });

      // --- FINISH ---
      setStatus('finished');
      setTestType('download'); // Show download stats by default when finished
      setResultId(Date.now().toString());

    } catch (error) {
      console.error("Speed test failed:", error);
      setStatus('error');
      setTestType('idle');
      setErrorMessage(error instanceof Error ? error.message : 'The test failed. Please try again.');
    }
  }, []);

  const isTesting = status.startsWith('testing');

  const getGaugeValue = () => {
    if (status === 'testing-download' || status === 'testing-upload') {
        return currentSpeed;
    }
    if (status === 'finished') {
        return testType === 'download' ? displayValues.download : displayValues.upload;
    }
    return 0;
  }
  
  const getGaugeType = (): TestType => {
     return testType;
  }

  return (
    <div className="bg-background text-foreground min-h-screen flex items-center justify-center p-4 sm:p-8 font-['Inter',_sans-serif]">
      <div className="w-full max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-4 px-2 flex-wrap gap-y-2">
            {resultId ? (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-muted-foreground">SHARE</span>
                    <Button variant="outline" size="icon" className="rounded-full w-8 h-8"><LinkIcon className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" className="rounded-full w-8 h-8"><Twitter className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" className="rounded-full w-8 h-8"><Facebook className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" className="rounded-full w-8 h-8"><MoreHorizontal className="w-4 h-4" /></Button>
                </div>
            ) : <div />}
            <div className="text-sm text-muted-foreground">{resultId ? `Result ID ${resultId}` : ''}</div>
            <div className="flex items-center gap-4">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground"><CheckCircle className="w-4 h-4 mr-2" /> RESULTS</Button>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground"><Settings className="w-4 h-4 mr-2" /> SETTINGS</Button>
            </div>
        </header>

        <main className="bg-card p-6 sm:p-10 rounded-xl shadow-2xl">
            <div className="flex flex-col items-center">
                <Gauge value={getGaugeValue()} type={getGaugeType()} />

                <div className="mt-8">
                    <Button onClick={runTest} disabled={isTesting} size="lg" className="rounded-full w-40 h-16 text-2xl font-bold">
                        {isTesting ? <RotateCw className="w-8 h-8 animate-spin" /> : (status === 'idle' || status === 'error' ? 'GO' : 'Again')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 text-center text-muted-foreground mt-12">
                <button className="text-center group" onClick={() => setTestType('ping')}>
                  <div className="text-sm">Ping</div>
                  <div className="font-bold text-foreground text-2xl group-hover:text-primary transition-colors">{displayValues.ping.toFixed(0)} <span className="text-sm">ms</span></div>
                </button>
                <button className="text-center group" onClick={() => setTestType('ping')}>
                  <div className="text-sm">Jitter</div>
                  <div className="font-bold text-foreground text-2xl group-hover:text-primary transition-colors">{displayValues.jitter.toFixed(0)} <span className="text-sm">ms</span></div>
                </button>
                <button className="text-center group" onClick={() => setTestType('download')}>
                  <div className="text-sm">Download</div>
                  <div className="font-bold text-foreground text-2xl group-hover:text-primary transition-colors">{displayValues.download.toFixed(2)} <span className="text-sm">Mbps</span></div>
                </button>
                <button className="text-center group" onClick={() => setTestType('upload')}>
                  <div className="text-sm">Upload</div>
                  <div className="font-bold text-foreground text-2xl group-hover:text-accent transition-colors">{displayValues.upload.toFixed(2)} <span className="text-sm">Mbps</span></div>
                </button>
            </div>

            {errorMessage && (
                <div className="text-center text-destructive mt-4">{errorMessage}</div>
            )}
            
            <Separator className="my-8 bg-border/50" />
            
            <div className="grid md:grid-cols-2 gap-8 items-start text-sm">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-muted-foreground" />
                        <div>
                            <div className="text-muted-foreground">{connectionInfo.isp}</div>
                            <div className="font-bold text-foreground">{connectionInfo.ipAddress}</div>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-muted-foreground" />
                        <div>
                            <div className="text-muted-foreground">{connectionInfo.serverProvider}</div>
                            <div className="font-bold text-foreground">{connectionInfo.serverLocation}</div>
                            <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80">Change Server</Button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}
