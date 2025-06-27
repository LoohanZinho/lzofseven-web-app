'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" {...props}>
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.804 12.12C34.553 8.246 29.5 6 24 6C12.955 6 4 14.955 4 26s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
    ></path>
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.844-5.844C34.553 8.246 29.5 6 24 6C16.318 6 9.656 10.337 6.306 14.691z"
    ></path>
    <path
      fill="#4CAF50"
      d="M24 46c5.5 0 10.553-1.754 14.694-4.819l-6.571-4.819C29.345 39.9 26.852 42 24 42c-5.039 0-9.345-3.108-11.124-7.489l-6.571 4.819C9.656 41.663 16.318 46 24 46z"
    ></path>
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.571 4.819C42.222 35.242 44 30.8 44 26c0-1.341-.138-2.65-.389-3.917z"
    ></path>
  </svg>
);

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Net Tools
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to access your network utilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Link href="/dashboard" className="w-full">
              <Button variant="outline" className="w-full h-12 text-base">
                <GoogleIcon className="mr-2 h-6 w-6" />
                Sign in with Google
              </Button>
            </Link>
            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to our Terms of Service.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
