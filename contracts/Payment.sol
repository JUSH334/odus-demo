// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Payment {
    
    struct PaymentRecord {
        string itemId;
        string itemType;
        address payer;
        uint256 amount;
        uint256 timestamp;
        bool completed;
        string memberID;
    }
    
    mapping(string => PaymentRecord) public payments;
    mapping(string => bool) public itemPaid;
    mapping(address => string[]) public userPayments;
    
    uint256 public totalPaymentsProcessed;
    uint256 public totalAmountProcessed;
    address public owner;
    
    event PaymentProcessed(
        string indexed paymentId,
        string itemId,
        address indexed payer,
        uint256 amount,
        uint256 timestamp
    );
    
    event PaymentReceived(address indexed from, uint256 amount);
    event FundsWithdrawn(address indexed to, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function processPayment(
        string memory _paymentId,
        string memory _itemId,
        string memory _itemType,
        string memory _memberID
    ) public payable returns (bool) {
        require(msg.value > 0, "Payment amount must be greater than 0");
        require(bytes(_paymentId).length > 0, "Payment ID cannot be empty");
        require(bytes(_itemId).length > 0, "Item ID cannot be empty");
        require(!payments[_paymentId].completed, "Payment already processed");
        require(!itemPaid[_itemId], "Item already paid");
        
        payments[_paymentId] = PaymentRecord({
            itemId: _itemId,
            itemType: _itemType,
            payer: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            completed: true,
            memberID: _memberID
        });
        
        itemPaid[_itemId] = true;
        userPayments[msg.sender].push(_paymentId);
        totalPaymentsProcessed++;
        totalAmountProcessed += msg.value;
        
        emit PaymentProcessed(_paymentId, _itemId, msg.sender, msg.value, block.timestamp);
        emit PaymentReceived(msg.sender, msg.value);
        
        return true;
    }
    
    function getPayment(string memory _paymentId) 
        public view
        returns (
            string memory itemId,
            string memory itemType,
            address payer,
            uint256 amount,
            uint256 timestamp,
            bool completed
        ) 
    {
        PaymentRecord memory payment = payments[_paymentId];
        return (
            payment.itemId,
            payment.itemType,
            payment.payer,
            payment.amount,
            payment.timestamp,
            payment.completed
        );
    }
    
    function isItemPaid(string memory _itemId) public view returns (bool) {
        return itemPaid[_itemId];
    }
    
    function getUserPayments(address _user) public view returns (string[] memory) {
        return userPayments[_user];
    }
    
    function getStats() public view returns (uint256, uint256, uint256) {
        return (totalPaymentsProcessed, totalAmountProcessed, address(this).balance);
    }
    
    function withdraw(uint256 _amount) public onlyOwner {
        require(_amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = payable(owner).call{value: _amount}("");
        require(success, "Withdrawal failed");
        emit FundsWithdrawn(owner, _amount);
    }
    
    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }
}