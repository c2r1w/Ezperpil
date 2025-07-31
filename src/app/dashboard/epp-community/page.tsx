
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Network } from 'lucide-react';

export default function EppCommunityPage() {
  return (
    <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">EPP Community</h1>
          <p className="text-muted-foreground">
            Connect with the EPP Community.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome to the Community</CardTitle>
          <CardDescription>
            This section is under construction. Exciting features are coming soon!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
            <Network className="h-16 w-16 mb-4" />
            <p>Community features will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
