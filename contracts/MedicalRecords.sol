// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MedicalRecords
 * @dev Standalone smart contract for medical records storage
 * @notice This contract can work independently or with PatientRegistry
 */
contract MedicalRecords {
    
    struct MedicalRecord {
        string recordId;
        string encryptedDataHash; // IPFS hash or encrypted data reference
        string recordType; // "lab", "prescription", "imaging", "visit", etc.
        uint256 timestamp;
        address uploadedBy;
        bool isActive;
        string metadata; // Additional JSON metadata
    }
    
    // Mappings
    mapping(address => mapping(uint256 => MedicalRecord)) public patientRecords;
    mapping(address => uint256) public patientRecordCount;
    mapping(string => bool) public recordIdExists;
    mapping(address => bool) public authorizedPatients;
    
    address public owner;
    address public patientRegistryContract; // Optional: link to PatientRegistry
    uint256 public totalRecordsStored;
    
    // Events
    event MedicalRecordAdded(
        address indexed patientAddress,
        string recordId,
        string recordType,
        uint256 timestamp,
        address uploadedBy
    );
    
    event MedicalRecordUpdated(
        address indexed patientAddress,
        string recordId,
        uint256 timestamp
    );
    
    event MedicalRecordDeactivated(
        address indexed patientAddress,
        string recordId,
        uint256 timestamp
    );
    
    event PatientAuthorized(
        address indexed patientAddress,
        uint256 timestamp
    );
    
    event PatientDeauthorized(
        address indexed patientAddress,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyAuthorizedPatient() {
        require(
            authorizedPatients[msg.sender] || msg.sender == owner,
            "Not authorized to add records"
        );
        _;
    }
    
    modifier onlyPatientOrOwner(address _patientAddress) {
        require(
            msg.sender == _patientAddress || msg.sender == owner,
            "Only patient or owner can access"
        );
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Set the PatientRegistry contract address (optional)
     */
    function setPatientRegistryContract(address _registryAddress) 
        public 
        onlyOwner 
    {
        patientRegistryContract = _registryAddress;
    }
    
    /**
     * @dev Authorize a patient to add records
     */
    function authorizePatient(address _patientAddress) 
        public 
        onlyOwner 
        returns (bool) 
    {
        require(_patientAddress != address(0), "Invalid address");
        authorizedPatients[_patientAddress] = true;
        
        emit PatientAuthorized(_patientAddress, block.timestamp);
        return true;
    }
    
    /**
     * @dev Deauthorize a patient
     */
    function deauthorizePatient(address _patientAddress) 
        public 
        onlyOwner 
        returns (bool) 
    {
        authorizedPatients[_patientAddress] = false;
        
        emit PatientDeauthorized(_patientAddress, block.timestamp);
        return true;
    }
    
    /**
     * @dev Add a new medical record
     */
    function addMedicalRecord(
        string memory _recordId,
        string memory _encryptedDataHash,
        string memory _recordType,
        string memory _metadata
    ) public onlyAuthorizedPatient returns (bool) {
        require(bytes(_recordId).length > 0, "Record ID cannot be empty");
        require(bytes(_encryptedDataHash).length > 0, "Data hash cannot be empty");
        require(!recordIdExists[_recordId], "Record ID already exists");
        
        uint256 recordIndex = patientRecordCount[msg.sender];
        
        patientRecords[msg.sender][recordIndex] = MedicalRecord({
            recordId: _recordId,
            encryptedDataHash: _encryptedDataHash,
            recordType: _recordType,
            timestamp: block.timestamp,
            uploadedBy: msg.sender,
            isActive: true,
            metadata: _metadata
        });
        
        recordIdExists[_recordId] = true;
        patientRecordCount[msg.sender]++;
        totalRecordsStored++;
        
        emit MedicalRecordAdded(
            msg.sender,
            _recordId,
            _recordType,
            block.timestamp,
            msg.sender
        );
        
        return true;
    }
    
    /**
     * @dev Update an existing medical record
     */
    function updateMedicalRecord(
        uint256 _recordIndex,
        string memory _encryptedDataHash,
        string memory _metadata
    ) public onlyAuthorizedPatient returns (bool) {
        require(_recordIndex < patientRecordCount[msg.sender], "Invalid record index");
        require(patientRecords[msg.sender][_recordIndex].isActive, "Record not active");
        require(bytes(_encryptedDataHash).length > 0, "Data hash cannot be empty");
        
        patientRecords[msg.sender][_recordIndex].encryptedDataHash = _encryptedDataHash;
        patientRecords[msg.sender][_recordIndex].metadata = _metadata;
        
        emit MedicalRecordUpdated(
            msg.sender,
            patientRecords[msg.sender][_recordIndex].recordId,
            block.timestamp
        );
        
        return true;
    }
    
    /**
     * @dev Deactivate a medical record (soft delete)
     */
    function deactivateMedicalRecord(uint256 _recordIndex) 
        public 
        onlyAuthorizedPatient 
        returns (bool) 
    {
        require(_recordIndex < patientRecordCount[msg.sender], "Invalid record index");
        require(patientRecords[msg.sender][_recordIndex].isActive, "Record already inactive");
        
        patientRecords[msg.sender][_recordIndex].isActive = false;
        
        emit MedicalRecordDeactivated(
            msg.sender,
            patientRecords[msg.sender][_recordIndex].recordId,
            block.timestamp
        );
        
        return true;
    }
    
    /**
     * @dev Get a specific medical record
     */
    function getMedicalRecord(address _patientAddress, uint256 _recordIndex)
        public
        view
        onlyPatientOrOwner(_patientAddress)
        returns (
            string memory recordId,
            string memory encryptedDataHash,
            string memory recordType,
            uint256 timestamp,
            address uploadedBy,
            bool isActive,
            string memory metadata
        )
    {
        require(_recordIndex < patientRecordCount[_patientAddress], "Invalid record index");
        
        MedicalRecord memory record = patientRecords[_patientAddress][_recordIndex];
        
        return (
            record.recordId,
            record.encryptedDataHash,
            record.recordType,
            record.timestamp,
            record.uploadedBy,
            record.isActive,
            record.metadata
        );
    }
    
    /**
     * @dev Get patient's record count
     */
    function getPatientRecordCount(address _patientAddress)
        public
        view
        returns (uint256)
    {
        return patientRecordCount[_patientAddress];
    }
    
    /**
     * @dev Get all active record IDs for a patient
     */
    function getPatientRecordIds(address _patientAddress)
        public
        view
        onlyPatientOrOwner(_patientAddress)
        returns (string[] memory)
    {
        uint256 count = patientRecordCount[_patientAddress];
        
        // First pass: count active records
        uint256 activeCount = 0;
        for (uint256 i = 0; i < count; i++) {
            if (patientRecords[_patientAddress][i].isActive) {
                activeCount++;
            }
        }
        
        // Second pass: populate array
        string[] memory recordIds = new string[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < count; i++) {
            if (patientRecords[_patientAddress][i].isActive) {
                recordIds[index] = patientRecords[_patientAddress][i].recordId;
                index++;
            }
        }
        
        return recordIds;
    }
    
    /**
     * @dev Check if a patient is authorized
     */
    function isPatientAuthorized(address _patientAddress) 
        public 
        view 
        returns (bool) 
    {
        return authorizedPatients[_patientAddress];
    }
    
    /**
     * @dev Get total records in the system
     */
    function getTotalRecords() public view returns (uint256) {
        return totalRecordsStored;
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }
    
    /**
     * @dev Get my record count
     */
    function getMyRecordCount() public view returns (uint256) {
        return patientRecordCount[msg.sender];
    }
    
    /**
     * @dev Check if I'm authorized
     */
    function amIAuthorized() public view returns (bool) {
        return authorizedPatients[msg.sender];
    }
}
