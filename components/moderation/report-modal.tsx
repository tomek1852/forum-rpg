"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { createModerationReport, getApiErrorMessage } from "@/lib/api";
import type { ModerationReportTargetType } from "@/lib/types";

interface ReportModalProps {
  targetType: ModerationReportTargetType;
  targetId: string;
  label: string;
  onClose: () => void;
}

export function ReportModal({ targetType, targetId, label, onClose }: ReportModalProps) {
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createModerationReport({ targetType, targetId, reason }),
    onSuccess: () => {
      onClose();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-xl">
        <h2 className="font-display text-2xl text-[color:var(--foreground)]">
          Zgłoś {label}
        </h2>
        <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">
          Opisz powód zgłoszenia. Moderator przejrzy je i podejmie decyzję.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <textarea
            className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm placeholder:text-[color:var(--foreground-subtle)] focus:outline-none focus:ring-2 focus:ring-[color:var(--foreground)]"
            placeholder="Opisz problem (min. 10 znaków)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            minLength={10}
            maxLength={1000}
            required
          />

          {mutation.isError ? (
            <p className="text-sm text-[#9d3d2d]">
              {getApiErrorMessage(mutation.error)}
            </p>
          ) : null}

          {mutation.isSuccess ? (
            <p className="text-sm text-green-700">Zgłoszenie zostało wysłane.</p>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || reason.length < 10}
            >
              Wyślij zgłoszenie
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
