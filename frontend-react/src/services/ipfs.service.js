import axios from 'axios';

const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.REACT_APP_PINATA_SECRET_KEY;
const PINATA_GATEWAY = process.env.REACT_APP_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

class IPFSService {
  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.pinata.cloud',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY
      }
    });
  }

  async uploadJSON(data) {
    try {
      const response = await this.client.post('/pinning/pinJSONToIPFS', data);
      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw error;
    }
  }

  async uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.client.post('/pinning/pinFileToIPFS', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading file to IPFS:', error);
      throw error;
    }
  }

  getGatewayURL(hash) {
    return `${PINATA_GATEWAY}${hash}`;
  }
}

export default new IPFSService(); 