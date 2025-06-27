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
  ArrowDown,
  ArrowUp,
  Timer,
  ArrowLeftRight,
  Network,
  Globe,
  User,
  RotateCw
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

type Status = 'idle' | 'testing-ping' | 'testing-download' | 'testing-upload' | 'finished' | 'error';

const AnimatedNumber = ({ value, decimals = 0, duration = 1500 }: { value: number; decimals?: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;

    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      const newDisplayValue = startValue + (value - startValue) * progress;
      setDisplayValue(newDisplayValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    requestAnimationFrame(animate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span>{displayValue.toFixed(decimals)}</span>;
};

const RatingSelector = () => {
    const [selected, setSelected] = useState<number | null>(null);
    return (
        <div>
            <h3 className="text-center text-muted-foreground mb-4 text-sm">
                HOW LIKELY IS IT THAT YOU WOULD RECOMMEND ATUALNET TO A FRIEND OR COLLEAGUE?
            </h3>
            <div className="flex justify-center items-center flex-wrap gap-2 mb-2">
                {Array.from({ length: 11 }, (_, i) => i).map((num) => (
                    <Button
                        key={num}
                        variant={selected === num ? 'default' : 'secondary'}
                        size="icon"
                        className="w-8 h-8 rounded-md"
                        onClick={() => setSelected(num)}
                    >
                        {num}
                    </Button>
                ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-2">
                <span>Not at all likely</span>
                <span>Extremely Likely</span>
            </div>
        </div>
    );
};

export default function SpeedTestPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [displayValues, setDisplayValues] = useState({ ping: 0, jitter: 0, download: 0, upload: 0 });
  const [errorMessage, setErrorMessage] = useState('');
  const [resultId, setResultId] = useState<number | null>(null);
  
  const connectionInfo = {
    isp: 'AtualNet',
    ipAddress: '187.85.49.31',
    serverProvider: 'GROOVE TELECOM',
    serverLocation: 'Ananindeua',
    connections: 'Multi',
  };

  const runTest = useCallback(async () => {
    setStatus('testing-ping');
    setDisplayValues({ ping: 0, jitter: 0, download: 0, upload: 0 });
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
        await new Promise(res => setTimeout(res, 300));
      }
      const avgPing = pings.reduce((a, b) => a + b, 0) / pingCount;
      const jitter = pings.slice(1).reduce((acc, current, i) => acc + Math.abs(current - pings[i]), 0) / (pingCount - 1);
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
      setResultId(Date.now());

    } catch (error) {
      console.error("Speed test failed:", error);
      setStatus('error');
      setErrorMessage('The speed test failed. Please check your connection and try again.');
    }
  }, []);
  
  const isTesting = status.startsWith('testing');

  return (
    <div className="bg-background text-foreground min-h-screen flex items-center justify-center p-4 sm:p-8 font-['Inter',_sans-serif]">
      <div className="w-full max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-4 px-2 flex-wrap gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-muted-foreground">SHARE</span>
            <Button variant="outline" size="icon" className="rounded-full w-8 h-8"><LinkIcon className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" className="rounded-full w-8 h-8"><Twitter className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" className="rounded-full w-8 h-8"><Facebook className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" className="rounded-full w-8 h-8"><MoreHorizontal className="w-4 h-4" /></Button>
          </div>
          <div className="text-sm text-muted-foreground">{resultId ? `Result ID ${resultId}` : ''}</div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground"><CheckCircle className="w-4 h-4 mr-2" /> RESULTS</Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground"><Settings className="w-4 h-4 mr-2" /> SETTINGS</Button>
          </div>
        </header>

        <main className="bg-card p-6 sm:p-10 rounded-xl shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-center">
            <div className="text-center order-1 md:order-none">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <ArrowDown className="w-5 h-5"/>
                <span>DOWNLOAD</span>
                <span className="font-bold">Mbps</span>
              </div>
              <div className="text-5xl md:text-6xl font-bold text-primary my-2">
                <AnimatedNumber value={displayValues.download} decimals={2} />
              </div>
            </div>

            <div className="flex justify-center items-center my-8 md:my-0 order-3 md:order-none">
              <button
                onClick={runTest}
                disabled={isTesting}
                className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-transparent bg-clip-padding flex items-center justify-center text-2xl font-bold
                           before:content-[''] before:absolute before:inset-[-4px] before:z-[-1] before:rounded-full
                           before:bg-gradient-to-br before:from-primary/50 before:to-accent/50
                           hover:before:from-primary hover:before:to-accent transition-all duration-300
                           disabled:cursor-not-allowed disabled:opacity-50 disabled:before:from-muted/50 disabled:before:to-muted/50"
              >
                <div className="w-[calc(100%-8px)] h-[calc(100%-8px)] rounded-full bg-card flex items-center justify-center">
                  {isTesting ? (
                     <RotateCw className="w-8 h-8 animate-spin" />
                  ) : (
                    status === 'idle' ? 'GO' : <RotateCw className="w-8 h-8" />
                  )}
                </div>
              </button>
            </div>
            
            <div className="text-center order-2 md:order-none">
               <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <ArrowUp className="w-5 h-5"/>
                <span>UPLOAD</span>
                <span className="font-bold">Mbps</span>
              </div>
              <div className="text-5xl md:text-6xl font-bold text-accent my-2">
                <AnimatedNumber value={displayValues.upload} decimals={2} />
              </div>
            </div>
          </div>
          
          <div className="flex justify-center flex-wrap gap-x-8 gap-y-4 text-center text-muted-foreground mt-8">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4"/>
              <span>Ping</span>
              <span className="font-bold text-foreground ml-1">{displayValues.ping.toFixed(0)}</span>
              <span className="text-xs">ms</span>
            </div>
             <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4"/>
              <span>Jitter</span>
              <span className="font-bold text-foreground ml-1">{displayValues.jitter.toFixed(0)}</span>
              <span className="text-xs">ms</span>
            </div>
          </div>

          {errorMessage && (
            <div className="text-center text-destructive mt-4">{errorMessage}</div>
          )}
          
          <Separator className="my-8 bg-border/50" />
          
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                    <Network className="w-5 h-5 text-muted-foreground" />
                    <div>
                        <div className="text-muted-foreground">Connections</div>
                        <div className="font-bold text-foreground">{connectionInfo.connections}</div>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <div>
                        <div className="text-muted-foreground">{connectionInfo.serverProvider}</div>
                        <div className="font-bold text-foreground">{connectionInfo.serverLocation}</div>
                        <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80">Change Server</Button>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                        <div className="text-muted-foreground">{connectionInfo.isp}</div>
                        <div className="font-bold text-foreground">{connectionInfo.ipAddress}</div>
                    </div>
                </div>
            </div>
            <RatingSelector />
          </div>

        </main>
      </div>
    </div>
  );
}
