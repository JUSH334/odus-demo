ODUS DEPLOYMENT: https://jush334.github.io/odus-demo/


# Payment Smart Contract - DIDLab Network

Decentralized payment processing system on DIDLab QBFT blockchain for tracking healthcare payments with unique transaction IDs.

Note: W.I.P deployment/build

---

## 1. Deployment Details (EVM)

### Contract Information
- **Contract Name**: Payment
- **Contract Address**: `0x053aC9dE77E6117Ee01Cb1c5854b8b67CC4BFFe0`
- **Deploy Transaction Hash**: 0xaabdeae0c3e718799950a518f3c994166ed39b9f8408aaa85e8d02e882c6f5dd
- **Block Number**: 1344962
- **Network**: DIDLab QBFT (Chain ID: 252501)
- **Solidity Version**: 0.8.19 (Pre-Shanghai EVM compatible)

### Deployer
- **Deployer Address**: `0xFB3C61Dcc2dF6800C62E7ba2bcA5e9dd7d42f2F7`

### Successful Interaction
- **Transaction Hash**: 0xaabdeae0c3e718799950a518f3c994166ed39b9f8408aaa85e8d02e882c6f5dd
- **Function Called**: `processPayment()`
- **Block Explorer**: https://explorer.didlab.org/tx/[INSERT-TX-HASH]

### ABI Location
- **File**: `Payment-ABI.json` (root directory)
- **Also available in**: `artifacts/contracts/Payment.sol/Payment.json`

---

## 2. How to Run

### Prerequisites
```bash
node >= 16.0.0
npm >= 8.0.0
```

### Setup
```bash
# Clone repository
git clone [INSERT YOUR REPO URL]
cd payment-hardhat

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Configure Environment
Edit `.env` file:
```bash
DIDLAB_RPC_URL=https://eth.didlab.org
PRIVATE_KEY=your_private_key_here
```

### Get Test Tokens
Visit https://faucet.didlab.org and request TT tokens for your address.

### Compile Contract
```bash
npx hardhat compile
```

### Deploy Contract
```bash
npx hardhat run scripts/deploy.js --network didlab
```

**Expected Output:**
```
Deploying Payment Contract to DIDLab Network...
Deployment Account:
  Address: 0xFB3C61Dcc2dF6800C62E7ba2bcA5e9dd7d42f2F7
  Balance: 18.91 TT
Network Info:
  Chain ID: 252501
  Network Name: DIDLab
  RPC URL: https://eth.didlab.org
...
DEPLOYMENT SUCCESSFUL!
Contract Address: 0x053aC9dE77E6117Ee01Cb1c5854b8b67CC4BFFe0
```

### Interact with Contract
Open `interact-payment-fixed.html` in browser:
1. Connect MetaMask to DIDLab network
2. Click "Generate" buttons for unique IDs
3. Enter amount and member details
4. Click "Process Payment"

### Test Contract (Optional)
```bash
npx hardhat test --network didlab
```

---

## 3. IPFS Usage

**Not applicable** - This project does not use IPFS. All contract data is stored on-chain.

Alternative: If you want to add IPFS later for payment receipts/invoices:
- Upload receipt JSON to IPFS
- Store CID in contract as string
- Retrieve via CID when needed

---

## 4. Security Notes

### Access Control
- **Owner Role**: Deployer address (`0xFB3C61Dcc2dF6800C62E7ba2bcA5e9dd7d42f2F7`)
  - Can withdraw funds via `withdraw()` function
  - Ownership can be transferred if needed
- **Public Functions**: `processPayment()` - Anyone can make payments
- **View Functions**: `getPayment()`, `getStats()`, `getUserPayments()`, etc.

### Security Measures
1. **No secrets in Git**: 
   - Private keys are in `.env` (gitignored)
   - `.env.example` provided as template
   - Never commit `.env` file

2. **Input Validation**:
   - Payment IDs must be unique
   - Item IDs must be unique
   - Amount must be greater than 0
   - All string inputs checked for empty values

3. **Reentrancy Protection**:
   - `withdraw()` uses `.call{value:}` safely
   - State updates before external calls

4. **Access Restrictions**:
   - Only owner can withdraw funds
   - `onlyOwner` modifier enforced

### Environment Variables
See `.env.example`:
```bash
# DIDLab Network Configuration
DIDLAB_RPC_URL=https://eth.didlab.org

# Your wallet private key (DO NOT SHARE OR COMMIT)
PRIVATE_KEY=your_private_key_here
```

### Audit Recommendations
- Review withdrawal logic
- Test unique ID enforcement
- Verify gas limits on mainnet deployment
- Consider adding pausable functionality
- Add events for better tracking

---

## 5. Commit Hash & Repository

### Git Commit
```bash
# Get current commit hash
git log -1 --format="%H"
```

**Commit Hash**: [INSERT COMMIT HASH - Run: git log -1 --format="%H"]

**Repository Link**: https://github.com/JUSH334/odus-demo.git

### Verification
To verify this submission state:
```bash
git clone [INSERT YOUR REPO URL]
cd payment-hardhat
git checkout [INSERT COMMIT HASH]
```

---

## Additional Information

### File Structure
```
payment-hardhat/
├── contracts/
│   └── Payment.sol           # Main contract (Solidity 0.8.19)
├── scripts/
│   └── deploy.js             # Deployment script
├── artifacts/                # Compiled contracts (generated)
├── hardhat.config.js         # Hardhat configuration
├── package.json              # Dependencies
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── Payment-ABI.json          # Contract ABI (generated)
├── payment-deployment.json   # Deployment info (generated)
├── interact-payment-fixed.html  # Web interface
└── README.md                 # This file
```

### Network Details
- **Network**: DIDLab QBFT
- **Chain ID**: 252501
- **RPC**: https://eth.didlab.org
- **Explorer**: https://explorer.didlab.org
- **Faucet**: https://faucet.didlab.org
- **Native Token**: TT (TRUST)

### Contract Functions

**Write Functions:**
- `processPayment(paymentId, itemId, itemType, memberID)` - Process payment with unique IDs
- `withdraw(amount)` - Owner only: withdraw contract funds

**Read Functions:**
- `getPayment(paymentId)` - Get payment details
- `isItemPaid(itemId)` - Check if item paid
- `getUserPayments(address)` - Get user's payment history
- `getStats()` - Get contract statistics (total payments, total amount, balance)

### Known Issues
- Payment IDs and Item IDs must be unique (by design)
- Use auto-generate feature in HTML interface
- Execution will revert if duplicate IDs used

### Important Notes
- Contract compiled with Solidity 0.8.19 for DIDLab compatibility
- No PUSH0 opcode (pre-Shanghai EVM)
- All functions properly tested on DIDLab network
- Use the HTML interface for easy interaction

### License
MIT

---

## Quick Reference Commands

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Deploy to DIDLab
npx hardhat run scripts/deploy.js --network didlab

# Get deployment info
cat payment-deployment.json

# Get contract ABI
cat Payment-ABI.json

# Get git commit hash
git log -1 --format="%H"

# View contract on explorer
open https://explorer.didlab.org/address/0x053aC9dE77E6117Ee01Cb1c5854b8b67CC4BFFe0
```

---

## Support

- **DIDLab Documentation**: https://docs.didlab.org
- **Block Explorer**: https://explorer.didlab.org
- **Faucet**: https://faucet.didlab.org
- **RPC Endpoint**: https://eth.didlab.org

For issues or questions, please open an issue in the repository.
