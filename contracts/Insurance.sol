// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

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
        bool collateralDropped; 
        bool isApproved; 
        uint256 lastPaymentTimestamp;
    }

    mapping(address => User) public users;

    constructor(address payable _verifierCompany) {
        verifierCompany = _verifierCompany;
    }

       modifier onlyAdmin() {
        require(msg.sender == verifierCompany, "Only the contract verifier can call this function");
        _;
    }

 
    function setCollateralValue(uint256 _collateralAmount) external payable {
        require(_collateralAmount <= getCategoryMaxCollateral(), "Collateral value exceeds the limit");
        users[msg.sender].collateralAmount = _collateralAmount;
    }


    function setCollateralStatus(bool _collateralDropped) external payable {
        require(users[msg.sender].collateralAmount > 0, "No collateral value set");
        users[msg.sender].collateralDropped = _collateralDropped;
        users[msg.sender].isApproved = false;
    }


    function payPremium(uint256 _category) external payable {
        require(users[msg.sender].collateralAmount > 0, "No collateral value set");
        
        if (_category == 1) {
            require(users[msg.sender].collateralAmount <= CATEGORY_A_MAX_COLLATERAL, "Collateral value exceeds the limit for Category A");
            require(msg.value >= CATEGORY_A_PREMIUM, "Incorrect premium amount");
        } else if (_category == 2) {
            require(users[msg.sender].collateralAmount <= CATEGORY_B_MAX_COLLATERAL, "Collateral value exceeds the limit for Category B");
            require(msg.value >= CATEGORY_B_PREMIUM, "Incorrect premium amount");
        } else {
            revert("Invalid category");
        }

        _updateLastPaymentTimestamp(msg.sender);

        verifierCompany.transfer(msg.value); 
    }


    function approveCollateral(address userAddress, bool isApproved) external onlyAdmin {
        require(users[userAddress].collateralAmount > 0, "No collateral value set");

        users[userAddress].isApproved = isApproved;

        if (isApproved) {
            verifierCompany.transfer(users[userAddress].collateralAmount); // Transfer the collateral amount to the user
        }
    }


    function getCategoryMaxCollateral() private view returns (uint256) {
        if (users[msg.sender].collateralAmount == 0) {
            return CATEGORY_A_MAX_COLLATERAL; 
        }
        if (users[msg.sender].collateralAmount <= CATEGORY_A_MAX_COLLATERAL) {
            return CATEGORY_A_MAX_COLLATERAL;
        } else {
            return CATEGORY_B_MAX_COLLATERAL;
        }
    }


    function _updateLastPaymentTimestamp(address _user) private {
        if (users[_user].lastPaymentTimestamp == 0) {
            users[_user].lastPaymentTimestamp = block.timestamp;
        } else {
            require(block.timestamp >= users[_user].lastPaymentTimestamp + PAYMENT_INTERVAL, "Payment interval not reached");
            users[_user].lastPaymentTimestamp = block.timestamp;
        }
    }
}
