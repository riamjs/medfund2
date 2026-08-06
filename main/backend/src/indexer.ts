import { server, contract } from "./stellar";
import { supabase } from "./supabase";
import { scValToNative } from "@stellar/stellar-sdk";
import dotenv from "dotenv";
dotenv.config();

const POLL_INTERVAL_MS = 15_000;
let lastLedgerSeen: number | undefined = undefined;

async function pollOnce() {
    if (lastLedgerSeen === undefined) {
        const latest = await server.getLatestLedger();
        lastLedgerSeen = latest.sequence;
        console.log("Starting indexer from ledger", lastLedgerSeen);
        return;
    }

    console.log("Polling for new events from ledger", lastLedgerSeen);

    const events = await server.getEvents({
        startLedger: lastLedgerSeen,
        filters: [{ type: "contract", contractIds: [contract.contractId()] }],
    });

    for (const event of events.events) {
        try {
            await handleEvent(event);
        } catch (err: any) {
            console.error("Failed to handle event:", err.message);
        }
    }

    lastLedgerSeen = events.latestLedger;
}

async function handleEvent(event: any) {
    const topic = event.topic.map((t: any) => scValToNative(t));
    const symbol = topic[0]; // "fr_new" | "donated" | "mstone_ok" | "released"
    const value = scValToNative(event.value);

    console.log("Decoded event:", symbol, JSON.stringify({ topic, value }, (_k, v) => typeof v === "bigint" ? v.toString() : v));

    if (symbol === "fr_new") {
        // [fundraiserId, goal] — fundraiser row itself is created via POST /fundraisers, nothing to do here yet.
        console.log("Fundraiser created on-chain, id:", value[0].toString());
    }

    else if (symbol === "donated") {
        const donorWallet = topic[1];      // address
        const fundraiserId = topic[2];     // u64
        const amount = value;              // i128

        const { error } = await supabase.from("donations").upsert(
            {
                fundraiser_id: Number(fundraiserId),
                donor_wallet: donorWallet,
                amount: Number(amount),
                tx_hash: event.txHash,
            },
            { onConflict: "tx_hash" }
        );
        if (error) console.error("Failed to upsert donation:", error.message);
        else console.log("Donation upserted:", event.txHash);
    }

    else if (symbol === "mstone_ok") {
        const fundraiserId = value; // u64
        const { error } = await supabase
            .from("fundraisers")
            .update({ status: "milestone_verified" })
            .eq("id", Number(fundraiserId));
        if (error) console.error("Failed to update milestone status:", error.message);
        else console.log("Fundraiser marked milestone_verified:", fundraiserId.toString());
    }

    else if (symbol === "released") {
        // topic[1] is the patient address; value is the payout amount
        // We only have the patient address here, not the fundraiser id directly —
        // release_funds doesn't include fundraiser_id in its event, so we can't
        // reliably match a row from this event alone yet. Logging for now.
        console.log("Funds released to:", topic[1], "amount:", value.toString());
    }
}

setInterval(() => {
    pollOnce().catch((err) => console.error("Indexer poll failed:", err.message));
}, POLL_INTERVAL_MS);

console.log("Indexer polling started");
pollOnce().catch((err) => console.error("Indexer poll failed:", err.message));