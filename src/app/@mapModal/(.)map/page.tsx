
'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { CampusMapWrapper } from '@/components/map/map-wrapper';
import type { SelectedSpot } from '@/components/map/map';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function MapDialogIntercept() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadId = searchParams.get('threadId');

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        router.back();
      }
    },
    [router],
  );

  const handleSelectSpot = useCallback(
    (spot: SelectedSpot) => {
      if (!threadId) {
        router.back();
        return;
      }
      const params = new URLSearchParams({
        mapSelection: JSON.stringify({ threadId, spot }),
      });
      router.replace(`/chat?${params.toString()}`, { scroll: false });
    },
    [router, threadId],
  );

  return (
    <Dialog defaultOpen onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[min(95svh,820px)] w-full max-w-[calc(100vw-3rem)] flex-col overflow-hidden p-0 sm:max-w-[min(1200px,95vw)]">
        <DialogHeader className="space-y-2 px-6 pb-4 pt-6">
          <DialogTitle>Choose a meetup spot</DialogTitle>
          <DialogDescription>
            {threadId
              ? 'Tap a zone, pick a marker, then press “Select This Spot” to share it in chat.'
              : 'Select a conversation before sharing a meetup spot.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6">
          <CampusMapWrapper className="h-[53vh]" onSelectSpot={handleSelectSpot} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
