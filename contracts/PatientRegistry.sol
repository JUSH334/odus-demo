// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PatientRegistry
 * @dev Patient registration and data management smart contract for SecureHealth Chain
 * @notice This contract stores encrypted patient data on the blockchain
 */
contract PatientRegistry {
    
    // Struct to store patient information
    struct Patient {
        string memberID;
        uint256 registrationTimestamp;
        bool isActive;
        address assignedProvider;
        string encryptedData;
    }
    
    // Mappings
    mapping(address => Patient) public patients;
    mapping(string => address) public memberIDToAddress;
    mapping(string => bool) public isMemberIDRegistered;
    
    address[] public patientAddresses;
    address public owner;
    uint256 public totalPatientsRegistered;
    
    // Events
    event PatientRegistered(
        address indexed patientAddress,
        string memberID,
        uint256 timestamp
    );
    
    event PatientUpdated(
        address indexed patientAddress,
        string memberID,
        uint256 timestamp
    );
    
    event ProviderAssigned(
        address indexed patientAddress,
        address indexed providerAddress,
        uint256 timestamp
    );
    
    event PatientDeactivated(
        address indexed patientAddress,
        string memberID,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyPatientOrOwner(address _patientAddress) {
        require(
            msg.sender == _patientAddress || msg.sender == owner,
            "Only patient or owner can call this function"
        );
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function registerPatient(
        string memory _memberID,
        string memory _encryptedData
    ) public returns (bool) {
        require(bytes(_memberID).length > 0, "Member ID cannot be empty");
        require(bytes(_encryptedData).length > 0, "Encrypted data cannot be empty");
        require(!patients[msg.sender].isActive, "Patient already registered");
        require(!isMemberIDRegistered[_memberID], "Member ID already registered");
        
        patients[msg.sender] = Patient({
            memberID: _memberID,
            registrationTimestamp: block.timestamp,
            isActive: true,
            assignedProvider: address(0),
            encryptedData: _encryptedData
        });
        
        memberIDToAddress[_memberID] = msg.sender;
        isMemberIDRegistered[_memberID] = true;
        patientAddresses.push(msg.sender);
        totalPatientsRegistered++;
        
        emit PatientRegistered(msg.sender, _memberID, block.timestamp);
        
        return true;
    }
    
    function updatePatientData(string memory _encryptedData) 
        public 
        returns (bool) 
    {
        require(patients[msg.sender].isActive, "Patient not registered");
        require(bytes(_encryptedData).length > 0, "Encrypted data cannot be empty");
        
        patients[msg.sender].encryptedData = _encryptedData;
        
        emit PatientUpdated(
            msg.sender,
            patients[msg.sender].memberID,
            block.timestamp
        );
        
        return true;
    }
    
    function assignProvider(
        address _patientAddress,
        address _providerAddress
    ) public onlyOwner returns (bool) {
        require(patients[_patientAddress].isActive, "Patient not registered");
        require(_providerAddress != address(0), "Invalid provider address");
        
        patients[_patientAddress].assignedProvider = _providerAddress;
        
        emit ProviderAssigned(_patientAddress, _providerAddress, block.timestamp);
        
        return true;
    }
    
    function deactivatePatient(address _patientAddress) 
        public 
        onlyOwner 
        returns (bool) 
    {
        require(patients[_patientAddress].isActive, "Patient not active");
        
        patients[_patientAddress].isActive = false;
        
        emit PatientDeactivated(
            _patientAddress,
            patients[_patientAddress].memberID,
            block.timestamp
        );
        
        return true;
    }
    
    function getPatient(address _patientAddress)
        public
        view
        returns (
            string memory memberID,
            uint256 registrationTimestamp,
            bool isActive,
            address assignedProvider
        )
    {
        Patient memory patient = patients[_patientAddress];
        return (
            patient.memberID,
            patient.registrationTimestamp,
            patient.isActive,
            patient.assignedProvider
        );
    }
    
    function getPatientData(address _patientAddress)
        public
        view
        onlyPatientOrOwner(_patientAddress)
        returns (string memory)
    {
        require(patients[_patientAddress].isActive, "Patient not registered");
        return patients[_patientAddress].encryptedData;
    }
    
    function getPatientAddressByMemberID(string memory _memberID)
        public
        view
        returns (address)
    {
        return memberIDToAddress[_memberID];
    }
    
    function checkMemberID(string memory _memberID) 
        public 
        view 
        returns (bool) 
    {
        return isMemberIDRegistered[_memberID];
    }
    
    function getTotalPatients() public view returns (uint256) {
        return totalPatientsRegistered;
    }
    
    function getAllPatientAddresses() 
        public 
        view 
        onlyOwner 
        returns (address[] memory) 
    {
        return patientAddresses;
    }
    
    function getPatientAddressAtIndex(uint256 _index)
        public
        view
        onlyOwner
        returns (address)
    {
        require(_index < patientAddresses.length, "Index out of bounds");
        return patientAddresses[_index];
    }
    
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }
    
    function isRegistered() public view returns (bool) {
        return patients[msg.sender].isActive;
    }
    
    function getMyMemberID() public view returns (string memory) {
        require(patients[msg.sender].isActive, "You are not registered");
        return patients[msg.sender].memberID;
    }
}