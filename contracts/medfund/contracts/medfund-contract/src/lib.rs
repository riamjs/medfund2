//! MedFund — Milestone-Based Medical Fundraising Escrow
//!
//! This contract lets a patient open a fundraiser, lets donors send a
//! stablecoin (e.g. USDC) into escrow held by the contract, lets an
//! authorized verifier (a hospital or NGO) confirm that a treatment
//! milestone has been reached, and then releases the escrowed funds to
//! the patient only after that verification. Every step is recorded
//! on the Stellar ledger so donors can audit fund disbursement.

#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, String, Symbol,
};

// -----------------------------------------------------------------------
// Storage keys
// -----------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Monotonically increasing counter used to mint new fundraiser IDs.
    NextId,
    /// Fundraiser struct, keyed by its numeric ID.
    Fundraiser(u64),
}

// -----------------------------------------------------------------------
// Data types
// -----------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub struct Fundraiser {
    /// Wallet that ultimately receives released funds.
    pub patient: Address,
    /// Hospital or NGO wallet authorized to verify the treatment milestone.
    pub verifier: Address,
    /// Token contract address used for donations (e.g. USDC on Stellar).
    pub token: Address,
    /// Human-readable label for the milestone (e.g. "Surgery scheduled").
    pub milestone_label: String,
    /// Fundraising goal, in the token's smallest unit.
    pub goal: i128,
    /// Total amount donated so far, in the token's smallest unit.
    pub raised: i128,
    /// Whether the verifier has confirmed the milestone.
    pub milestone_verified: bool,
    /// Whether escrowed funds have already been released to the patient.
    pub released: bool,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// No fundraiser exists for the given ID.
    FundraiserNotFound = 1,
    /// Donation amount must be a positive value.
    InvalidAmount = 2,
    /// Caller is not the fundraiser's authorized verifier.
    NotVerifier = 3,
    /// Milestone must be verified before funds can be released.
    MilestoneNotVerified = 4,
    /// Funds for this fundraiser have already been released.
    AlreadyReleased = 5,
    /// There is nothing in escrow to release.
    NothingToRelease = 6,
}

const FUNDRAISER_CREATED: Symbol = Symbol::short("fr_new");
const DONATION_RECEIVED: Symbol = Symbol::short("donated");
const MILESTONE_VERIFIED: Symbol = Symbol::short("mstone_ok");
const FUNDS_RELEASED: Symbol = Symbol::short("released");

#[contract]
pub struct MedFundContract;

#[contractimpl]
impl MedFundContract {
    /// Step 1 of the MVP flow: "Patient creates fundraiser -> Smart
    /// contract escrow initialized."
    ///
    /// `patient` must authorize this call. `verifier` is the hospital or
    /// NGO wallet that will later confirm the treatment milestone. Returns
    /// the new fundraiser's ID.
    pub fn create_fundraiser(
        env: Env,
        patient: Address,
        verifier: Address,
        token: Address,
        milestone_label: String,
        goal: i128,
    ) -> Result<u64, Error> {
        patient.require_auth();

        if goal <= 0 {
            return Err(Error::InvalidAmount);
        }

        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextId)
            .unwrap_or(0u64);

        let fundraiser = Fundraiser {
            patient: patient.clone(),
            verifier,
            token,
            milestone_label,
            goal,
            raised: 0,
            milestone_verified: false,
            released: false,
        };

        env.storage()
            .instance()
            .set(&DataKey::Fundraiser(id), &fundraiser);
        env.storage().instance().set(&DataKey::NextId, &(id + 1));

        env.events()
            .publish((FUNDRAISER_CREATED, patient), (id, goal));

        Ok(id)
    }

    /// Step 2 of the MVP flow: "Donor sends USDC -> Transaction recorded
    /// on the Stellar ledger."
    ///
    /// Moves `amount` of the fundraiser's token from `donor` into escrow
    /// held by this contract, and updates the fundraiser's running total.
    pub fn donate(env: Env, donor: Address, fundraiser_id: u64, amount: i128) -> Result<(), Error> {
        donor.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut fundraiser: Fundraiser = env
            .storage()
            .instance()
            .get(&DataKey::Fundraiser(fundraiser_id))
            .ok_or(Error::FundraiserNotFound)?;

        // Pull funds from the donor into this contract's own balance.
        let token_client = token::Client::new(&env, &fundraiser.token);
        token_client.transfer(&donor, &env.current_contract_address(), &amount);

        fundraiser.raised += amount;
        env.storage()
            .instance()
            .set(&DataKey::Fundraiser(fundraiser_id), &fundraiser);

        env.events()
            .publish((DONATION_RECEIVED, donor, fundraiser_id), amount);

        Ok(())
    }

    /// Step 3 of the MVP flow: "Hospital/NGO verifies treatment milestone."
    ///
    /// Only the fundraiser's designated `verifier` may call this.
    pub fn verify_milestone(env: Env, verifier: Address, fundraiser_id: u64) -> Result<(), Error> {
        verifier.require_auth();

        let mut fundraiser: Fundraiser = env
            .storage()
            .instance()
            .get(&DataKey::Fundraiser(fundraiser_id))
            .ok_or(Error::FundraiserNotFound)?;

        if fundraiser.verifier != verifier {
            return Err(Error::NotVerifier);
        }

        fundraiser.milestone_verified = true;
        env.storage()
            .instance()
            .set(&DataKey::Fundraiser(fundraiser_id), &fundraiser);

        env.events()
            .publish((MILESTONE_VERIFIED, verifier), fundraiser_id);

        Ok(())
    }

    /// Step 4 of the MVP flow: "Smart contract releases funds -> Donor
    /// sees milestone completion and fund release on-chain."
    ///
    /// Anyone may trigger release (the check that matters is state, not
    /// caller identity), but funds only ever move to `fundraiser.patient`.
    pub fn release_funds(env: Env, fundraiser_id: u64) -> Result<i128, Error> {
        let mut fundraiser: Fundraiser = env
            .storage()
            .instance()
            .get(&DataKey::Fundraiser(fundraiser_id))
            .ok_or(Error::FundraiserNotFound)?;

        if fundraiser.released {
            return Err(Error::AlreadyReleased);
        }
        if !fundraiser.milestone_verified {
            return Err(Error::MilestoneNotVerified);
        }
        if fundraiser.raised <= 0 {
            return Err(Error::NothingToRelease);
        }

        let payout = fundraiser.raised;
        let token_client = token::Client::new(&env, &fundraiser.token);
        token_client.transfer(
            &env.current_contract_address(),
            &fundraiser.patient,
            &payout,
        );

        fundraiser.released = true;
        env.storage()
            .instance()
            .set(&DataKey::Fundraiser(fundraiser_id), &fundraiser);

        env.events()
            .publish((FUNDS_RELEASED, fundraiser.patient), payout);

        Ok(payout)
    }

    /// Read-only helper so donors/UIs can display live fundraiser state.
    pub fn get_fundraiser(env: Env, fundraiser_id: u64) -> Result<Fundraiser, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Fundraiser(fundraiser_id))
            .ok_or(Error::FundraiserNotFound)
    }
}

#[cfg(test)]
mod test;