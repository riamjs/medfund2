const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export async function releaseMilestone(
  milestoneId: number,
  destination: string,
  amount: number
) {
  const res = await fetch(`${BACKEND_URL}/api/release`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ milestoneId, destination, amount }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Release failed");
  return data as { txHash: string };
}