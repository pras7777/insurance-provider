// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * Insurance Contract
 * This contract provides two categories of insurance policies, each with a different premium and collateral limit.
 *      It includes functions for users to set collateral values, pay premiums, and for the admin to approve collateral.
 */
contract Insurance {
    address payable public verifierCompany;
    uint256 public constant CATEGORY_A_PREMIUM = 100000 wei;
    uint256 public constant CATEGORY_B_PREMIUM = 10000 wei;
    uint256 public constant PAYMENT_INTERVAL = 28 days;
    uint256 public constant CATEGORY_A_MAX_COLLATERAL = 3 ether;
    uint256 public constant CATEGORY_B_MAX_COLLATERAL = 2 ether;

    // User struct to store individual user details
    struct User {
        uint256 collateralAmount;
        bool collateralDropped; // Indicates if the collateral value has dropped
        bool isApproved; // Indicates if the user's collateral is approved
        uint256 lastPaymentTimestamp; // Timestamp of the last premium payment
    }

    mapping(address => User) public users;

    /**
     * @dev Sets the address of the verifier company upon contract deployment.
     * @param _verifierCompany The address of the verifier company (admin).
     */
    constructor(address payable _verifierCompany) {
        verifierCompany = _verifierCompany;
    }

    // Modifier to restrict certain functions to only the admin (verifier company)
    modifier onlyAdmin() {
        require(msg.sender == verifierCompany, "Only the contract verifier can call this function");
        _;
    }

    /**
     * @notice Sets the collateral value for the user's insurance.
     * @param _collateralAmount The amount of collateral to be set.
     */
    function setCollateralValue(uint256 _collateralAmount) external payable {
        require(_collateralAmount <= getCategoryMaxCollateral(), "Collateral value exceeds the limit");
        users[msg.sender].collateralAmount = _collateralAmount;
    }

    /**
     * @notice Updates the status of the user's collateral (whether it has dropped in value).
     * @param _collateralDropped The status of the collateral drop.
     */
    function setCollateralStatus(bool _collateralDropped) external payable {
        require(users[msg.sender].collateralAmount > 0, "No collateral value set");
        users[msg.sender].collateralDropped = _collateralDropped;
        users[msg.sender].isApproved = false;
    }

    /**
     * @notice Allows Category A users to pay their insurance premium.
     */
    function payPremiumCategoryA() external payable {
        require(users[msg.sender].collateralAmount > 0, "No collateral value set");
        require(users[msg.sender].collateralAmount <= CATEGORY_A_MAX_COLLATERAL, "Collateral value exceeds the limit for Category A");
        require(msg.value >= CATEGORY_A_PREMIUM, "Incorrect premium amount");

        _updateLastPaymentTimestamp(msg.sender);

        verifierCompany.transfer(msg.value); // Transfer the premium amount to the verifier company
    }

    /**
     * @notice Allows Category B users to pay their insurance premium.
     */
    function payPremiumCategoryB() external payable {
        require(users[msg.sender].collateralAmount > 0, "No collateral value set");
        require(users[msg.sender].collateralAmount <= CATEGORY_B_MAX_COLLATERAL, "Collateral value exceeds the limit for Category B");
        require(msg.value >= CATEGORY_B_PREMIUM, "Incorrect premium amount");

        _updateLastPaymentTimestamp(msg.sender);

        verifierCompany.transfer(msg.value); // Transfer the premium amount to the verifier company
    }

    /**
     * @notice Approves or declines a user's collateral based on the admin's decision.
     * @param userAddress The address of the user.
     * @param isApproved The approval status.
     */
    function approveCollateral(address userAddress, bool isApproved) external onlyAdmin {
        require(users[userAddress].collateralAmount > 0, "No collateral value set");

        users[userAddress].isApproved = isApproved;

        if (isApproved) {
            verifierCompany.transfer(users[userAddress].collateralAmount); // Transfer the collateral amount to the user
        }
    }

    /**
     * @notice Retrieves the maximum collateral value allowed for the user's insurance category.
     * @return The maximum collateral value allowed.
     */
    function getCategoryMaxCollateral() private view returns (uint256) {
        if (users[msg.sender].collateralAmount == 0) {
            return CATEGORY_A_MAX_COLLATERAL; // Default to Category A for users who have not set their collateral value yet
        }
        if (users[msg.sender].collateralAmount <= CATEGORY_A_MAX_COLLATERAL) {
            return CATEGORY_A_MAX_COLLATERAL;
        } else {
            return CATEGORY_B_MAX_COLLATERAL;
        }
    }

    /**
     * @dev Updates the last payment timestamp for a user upon premium payment.
     * @param _user The address of the user making the payment.
     */
    function _updateLastPaymentTimestamp(address _user) private {
        if (users[_user].lastPaymentTimestamp == 0) {
            users[_user].lastPaymentTimestamp = block.timestamp;
        } else {
            require(block.timestamp >= users[_user].lastPaymentTimestamp + PAYMENT_INTERVAL, "Payment interval not reached");
            users[_user].lastPaymentTimestamp = block.timestamp;
        }
    }
}
