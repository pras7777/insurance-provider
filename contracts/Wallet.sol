// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Wallet
 * @notice This smart contract provides wallet insurance with different packages. Users can choose 
 * from Regular, Robust, or Comprehensive packages, each with a different premium. Claims can be 
 * submitted and are subject to approval or rejection by the admin (verifier company).
 */
contract Wallet{
    address payable public verifierCompany;
    uint256 private constant REGULAR_PREMIUM = 1000;
    uint256 private constant ROBUST_PREMIUM = 10000;
    uint256 private constant COMPREHENSIVE_PREMIUM = 100000;
    uint256 private constant PAYMENT_INTERVAL = 28 days;

    enum InsurancePackage { Regular, Robust, Comprehensive }
    enum ClaimStatus { Pending, Approved, Rejected }

    struct User {
        InsurancePackage package;
        uint256 premiumAmount;
        uint256 lastPaymentTimestamp;
        uint256 totalPayments; 
        bool isActive;
    }

    mapping(address => User) public users;
    mapping(address => ClaimStatus) public claims;

    constructor(address payable _verifierCompany) {
        verifierCompany = _verifierCompany;
    }

    modifier onlyAdmin() {
        require(
            msg.sender == verifierCompany,
            "Only the admin can perform this action."
        );
        _;
    }

    /**
     * @notice Allows users to select an insurance package and make the premium payment
     * @param _package The chosen insurance package
     */
    function selectPackage(InsurancePackage _package) external payable {
        require(
            _package >= InsurancePackage.Regular && _package <= InsurancePackage.Comprehensive,
            "Invalid insurance package selected."
        );
        require(
            !users[msg.sender].isActive,
            "User already has an active insurance package."
        );

        User storage user = users[msg.sender];
        user.package = _package;
        user.isActive = true;
        user.lastPaymentTimestamp = block.timestamp;

        // Set the premium amount based on the selected insurance package
        if (_package == InsurancePackage.Regular) {
            user.premiumAmount = REGULAR_PREMIUM;
        } else if (_package == InsurancePackage.Robust) {
            user.premiumAmount = ROBUST_PREMIUM;
        } else if (_package == InsurancePackage.Comprehensive) {
            user.premiumAmount = COMPREHENSIVE_PREMIUM;
        }

        require(
            msg.value >= user.premiumAmount,
            "Insufficient premium amount."
        );
        (bool success, ) = verifierCompany.call{value: msg.value}("");
        require(success, "Premium transfer failed.");
    }
    

    /**
     * @notice Allows users to submit a claim for their insured wallet
     */
    function submitClaim() external {
        require(
            users[msg.sender].isActive,
            "User does not have an active insurance package."
        );
        require(
            claims[msg.sender] == ClaimStatus.Pending,
            "Claim has already been submitted or processed."
        );
        claims[msg.sender] = ClaimStatus.Pending;
    }

    /**
     * @notice Allows the admin to approve a user's claim and transfer the claim payout
     * @param _user The address of the user whose claim is to be approved
     */
    function approveClaim(address _user) external onlyAdmin {
        require(
            users[_user].isActive,
            "User does not have an active insurance package."
        );
        require(
            claims[_user] == ClaimStatus.Pending,
            "No pending claim for this user."
        );

        claims[_user] = ClaimStatus.Approved;
        uint256 claimPayout = users[_user].totalPayments * 2; // Payout is twice the total payments made by the user
        (bool success, ) = _user.call{value: claimPayout}("");
        require(success, "Claim payout failed.");
    }

    /**
     * @notice Allows the admin to reject a user's claim
     * @param _user The address of the user whose claim is to be rejected
     */
    function rejectClaim(address _user) external onlyAdmin {
        require(
            users[_user].isActive,
            "User does not have an active insurance package."
        );
        require(
            claims[_user] == ClaimStatus.Pending,
            "No pending claim for this user."
        );

        claims[_user] = ClaimStatus.Rejected;
    }

    /**
     * @notice Allows users to cancel their insurance package
     */
    function cancelInsurance() external {
        require(
            users[msg.sender].isActive,
            "User does not have an active insurance package."
        );

        users[msg.sender].isActive = false;
    }

    /**
     * @notice Allows users to pay their premium to the verifier company
     */
    function payPremiumToVerifier() external payable {
        User storage user = users[msg.sender];
        require(
            user.isActive,
            "User does not have an active insurance package."
        );

        uint256 elapsedTime = block.timestamp - user.lastPaymentTimestamp;
        uint256 missedPayments = elapsedTime / PAYMENT_INTERVAL;
        uint256 paymentDue = user.lastPaymentTimestamp + (missedPayments * PAYMENT_INTERVAL);

        require(
            block.timestamp >= paymentDue,
            "Premium payment is not yet due."
        );

        uint256 premiumsDue = missedPayments + 1; // Calculate the number of premiums due
        uint256 totalPremiumAmountDue = premiumsDue * user.premiumAmount; // Calculate total premium amount due

        user.lastPaymentTimestamp = paymentDue;
        user.totalPayments += premiumsDue;

        require(
            msg.value >= totalPremiumAmountDue,
            "Insufficient premium amount."
        );
        (bool success, ) = verifierCompany.call{value: totalPremiumAmountDue}("");
        require(success, "Premium transfer failed.");
    }
}
