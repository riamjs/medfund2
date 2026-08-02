#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Events as _},
    Env,
};

/// Deploys a fresh Stellar Asset Contract (used here as a stand-in for
/// USDC) and returns its client plus the admin address that can mint.
fn create_token<'a>(env: &Env) -> (token::Client<'a>, token::StellarAssetClient<'a>, Address) {
    let admin = Address::generate(env);
    let contract_id = env.register_stellar_asset_contract_v2(admin.clone());
    let client = token::Client::new(env, &contract_id.address());
    let asset_client = token::StellarAssetClient::new(env, &contract_id.address());
    (client, asset_client, admin)
}

/// Test 1 (Happy path): create -> donate -> verify -> release runs
/// end-to-end and the patient receives the escrowed funds.
#[test]
fn test_happy_path_full_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MedFundContract, ());
    let client = MedFundContractClient::new(&env, &contract_id);

    let (token_client, token_admin, _admin) = create_token(&env);

    let patient = Address::generate(&env);
    let verifier = Address::generate(&env);
    let donor = Address::generate(&env);

    token_admin.mint(&donor, &1_000_000);

    let fundraiser_id = client.create_fundraiser(
        &patient,
        &verifier,
        &token_client.address,
        &String::from_str(&env, "Surgery scheduled"),
        &150_000,
    );

    client.donate(&donor, &fundraiser_id, &150_000);
    client.verify_milestone(&verifier, &fundraiser_id);
    let payout = client.release_funds(&fundraiser_id);

    assert_eq!(payout, 150_000);
    assert_eq!(token_client.balance(&patient), 150_000);
    assert_eq!(token_client.balance(&donor), 850_000);
}

/// Test 2 (Edge case): a caller who is not the designated verifier
/// cannot confirm the milestone.
#[test]
fn test_unauthorized_verifier_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MedFundContract, ());
    let client = MedFundContractClient::new(&env, &contract_id);

    let (token_client, _token_admin, _admin) = create_token(&env);

    let patient = Address::generate(&env);
    let verifier = Address::generate(&env);
    let impostor = Address::generate(&env);

    let fundraiser_id = client.create_fundraiser(
        &patient,
        &verifier,
        &token_client.address,
        &String::from_str(&env, "Surgery scheduled"),
        &150_000,
    );

    let result = client.try_verify_milestone(&impostor, &fundraiser_id);
    assert_eq!(result, Err(Ok(Error::NotVerifier)));
}

/// Test 3 (State verification): after a donation, contract storage
/// reflects the correct running total and the release gate stays shut
/// until the milestone is verified.
#[test]
fn test_state_reflects_donation_and_release_gate() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MedFundContract, ());
    let client = MedFundContractClient::new(&env, &contract_id);

    let (token_client, token_admin, _admin) = create_token(&env);

    let patient = Address::generate(&env);
    let verifier = Address::generate(&env);
    let donor = Address::generate(&env);

    token_admin.mint(&donor, &1_000_000);

    let fundraiser_id = client.create_fundraiser(
        &patient,
        &verifier,
        &token_client.address,
        &String::from_str(&env, "Surgery scheduled"),
        &150_000,
    );

    client.donate(&donor, &fundraiser_id, &60_000);

    let state = client.get_fundraiser(&fundraiser_id);
    assert_eq!(state.raised, 60_000);
    assert_eq!(state.milestone_verified, false);
    assert_eq!(state.released, false);

    // Milestone not yet verified, so release must fail.
    let result = client.try_release_funds(&fundraiser_id);
    assert_eq!(result, Err(Ok(Error::MilestoneNotVerified)));
}

/// Test 4 (Edge case): funds cannot be released a second time once
/// already paid out.
#[test]
fn test_double_release_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MedFundContract, ());
    let client = MedFundContractClient::new(&env, &contract_id);

    let (token_client, token_admin, _admin) = create_token(&env);

    let patient = Address::generate(&env);
    let verifier = Address::generate(&env);
    let donor = Address::generate(&env);

    token_admin.mint(&donor, &1_000_000);

    let fundraiser_id = client.create_fundraiser(
        &patient,
        &verifier,
        &token_client.address,
        &String::from_str(&env, "Surgery scheduled"),
        &150_000,
    );

    client.donate(&donor, &fundraiser_id, &150_000);
    client.verify_milestone(&verifier, &fundraiser_id);
    client.release_funds(&fundraiser_id);

    let result = client.try_release_funds(&fundraiser_id);
    assert_eq!(result, Err(Ok(Error::AlreadyReleased)));
}

/// Test 5 (Edge case): donations of zero or negative amounts are
/// rejected before any token transfer is attempted.
#[test]
fn test_invalid_donation_amount_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MedFundContract, ());
    let client = MedFundContractClient::new(&env, &contract_id);

    let (token_client, _token_admin, _admin) = create_token(&env);

    let patient = Address::generate(&env);
    let verifier = Address::generate(&env);
    let donor = Address::generate(&env);

    let fundraiser_id = client.create_fundraiser(
        &patient,
        &verifier,
        &token_client.address,
        &String::from_str(&env, "Surgery scheduled"),
        &150_000,
    );

    let result = client.try_donate(&donor, &fundraiser_id, &0);
    assert_eq!(result, Err(Ok(Error::InvalidAmount)));
}