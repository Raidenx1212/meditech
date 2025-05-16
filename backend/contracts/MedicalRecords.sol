// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MedicalRecords {
    struct Record {
        string ipfsHash;
        uint256 timestamp;
    }

    struct DocumentApproval {
        string documentId;
        address patient;
        address doctor;
        uint256 timestamp;
        bool isApproved;
    }

    mapping(address => Record[]) private records;
    mapping(string => DocumentApproval) public documentApprovals;

    event RecordAdded(address indexed patient, string ipfsHash, uint256 timestamp);
    event DocumentApproved(
        string indexed documentId,
        address indexed patient,
        address indexed doctor,
        uint256 timestamp
    );

    function addRecord(address patient, string memory ipfsHash) public {
        records[patient].push(Record(ipfsHash, block.timestamp));
        emit RecordAdded(patient, ipfsHash, block.timestamp);
    }

    function getRecords(address patient) public view returns (Record[] memory) {
        return records[patient];
    }

    function addDocumentApproval(
        string memory documentId,
        address patient,
        address doctor,
        uint256 timestamp
    ) public {
        require(msg.sender == patient, "Only patient can approve documents");
        
        documentApprovals[documentId] = DocumentApproval({
            documentId: documentId,
            patient: patient,
            doctor: doctor,
            timestamp: timestamp,
            isApproved: true
        });
        
        emit DocumentApproved(documentId, patient, doctor, timestamp);
    }

    function getDocumentApproval(string memory documentId) 
        public 
        view 
        returns (
            string memory,
            address,
            address,
            uint256,
            bool
        ) 
    {
        DocumentApproval memory approval = documentApprovals[documentId];
        return (
            approval.documentId,
            approval.patient,
            approval.doctor,
            approval.timestamp,
            approval.isApproved
        );
    }
} 