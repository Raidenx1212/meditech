import React, { useEffect, useState } from 'react';
import BlockchainService from '../services/blockchain.service';

const PatientBlockchainRecords = ({ patientAddress }) => {
  const [records, setRecords] = useState([]);
  useEffect(() => {
    if (patientAddress) {
      BlockchainService.getPatientRecords(patientAddress).then(setRecords);
    }
  }, [patientAddress]);
  return (
    <div>
      <h2>Your Blockchain Medical Records</h2>
      <ul>
        {records.map((rec, idx) => (
          <li key={idx}>
            <a href={`https://gateway.pinata.cloud/ipfs/${rec.ipfsHash}`} target="_blank" rel="noopener noreferrer">
              {rec.ipfsHash}
            </a> (added: {new Date(rec.timestamp * 1000).toLocaleString()})
          </li>
        ))}
      </ul>
    </div>
  );
};
export default PatientBlockchainRecords; 