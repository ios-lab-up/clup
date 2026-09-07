"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { captureResult, publishResult } from "@/features/admin-results/actions";

interface ResultFormProps {
  registrationId: string;
  passingScore: number;
  careerName: string | null;
  result: { score: number; passed: boolean; published: boolean } | null;
}

export function ResultForm({ registrationId, passingScore, careerName, result }: ResultFormProps) {
  const router = useRouter();
  const [score, setScore] = useState(result?.score?.toString() ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCapture(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const captureResultInput = { registrationId, score: Number(score) };
    const submitResult = await captureResult(captureResultInput);
    setPending(false);
    if (!submitResult.ok) {
      setError(submitResult.message);
      return;
    }
    router.refresh();
  }

  async function handlePublish() {
    setPending(true);
    setError(null);
    const publishResultOutcome = await publishResult(registrationId);
    setPending(false);
    if (!publishResultOutcome.ok) {
      setError(publishResultOutcome.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Passing minimum for this student{careerName ? ` (${careerName})` : ""}: {passingScore}
      </p>

      <form onSubmit={handleCapture} className="flex items-end gap-3">
        <div>
          <Label htmlFor="score">Score</Label>
          <Input
            id="score"
            type="number"
            value={score}
            onChange={(event) => setScore(event.target.value)}
            required
            className="w-32"
          />
        </div>
        <Button type="submit" loading={pending}>
          Save score
        </Button>
      </form>

      {result && (
        <div className="flex items-center gap-3">
          <Badge tone={result.passed ? "green" : "red"}>{result.passed ? "Passed" : "Not passed"}</Badge>
          {result.published ? (
            <Badge tone="green">Published</Badge>
          ) : (
            <Button variant="secondary" onClick={handlePublish} loading={pending}>
              Publish result
            </Button>
          )}
        </div>
      )}

      {error && <Alert variant="error">{error}</Alert>}
    </div>
  );
}
