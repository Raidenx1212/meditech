// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MedicalRecords {
    address public admin;
    
    struct Record {
        string ipfsHash;
        uint256 timestamp;
    }
    
    struct DocumentApproval {
        string ipfsHash;
        address patient;
        bool approved;
        uint256 timestamp;
    }
    
    // Mapping from patient address to their records
    mapping(address => Record[]) private records;
    
    // Mapping from patient address to their document approvals
    mapping(address => DocumentApproval[]) public approvals;
    
    // Event emitted when a document is approved or rejected
    event DocumentApprovalUpdated(
        address indexed patient,
        string ipfsHash,
        bool approved,
        uint256 timestamp
    );
    
    constructor() {
        admin = msg.sender;
    }
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }
    
    modifier onlyPatient() {
        require(msg.sender != admin, "Admin cannot approve documents");
        _;
    }
    
    function addRecord(address patient, string memory ipfsHash) public onlyAdmin {
        records[patient].push(Record({
            ipfsHash: ipfsHash,
            timestamp: block.timestamp
        }));
    }
    
    function getRecords(address patient) public view returns (Record[] memory) {
        require(msg.sender == patient || msg.sender == admin, "Unauthorized access");
        return records[patient];
    }
    
    function approveDocument(string memory ipfsHash, bool approved) public onlyPatient {
        approvals[msg.sender].push(DocumentApproval({
            ipfsHash: ipfsHash,
            patient: msg.sender,
            approved: approved,
            timestamp: block.timestamp
        }));
        
        emit DocumentApprovalUpdated(msg.sender, ipfsHash, approved, block.timestamp);
    }
    
    function getDocumentApprovals(address patient) public view returns (DocumentApproval[] memory) {
        require(msg.sender == patient || msg.sender == admin, "Unauthorized access");
        return approvals[patient];
    }
} 