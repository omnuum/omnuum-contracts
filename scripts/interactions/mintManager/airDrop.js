const inquirer = require('inquirer');
const { ethers } = require('hardhat');
const { nullCheck, getRPCProvider } = require('../../deployments/deployHelper');
const { testValues } = require('../../../utils/constants');

const inquirerParams = {
  nft_owner_private_key: 'nft_owner_private_key',
  nft_address: 'nft_address',
  mint_manager_address: 'mint_manager_address',
  airdrop_receiver_A: 'airdrop_receiver_A',
  quantity_to_A: 'quantity_to_A',
  airdrop_receiver_B: 'airdrop_receiver_B',
  quantity_to_B: 'quantity_to_B',
  estimate_gas: 'estimate_gas',
};

const questions = [
  {
    name: inquirerParams.nft_owner_private_key,
    type: 'input',
    message: '🤔 NFT project owner private key is ...',
    validate: nullCheck,
  },
  {
    name: inquirerParams.nft_address,
    type: 'input',
    message: '🤔 NFT contract address is...',
    validate: nullCheck,
  },
  {
    name: inquirerParams.mint_manager_address,
    type: 'input',
    message: '🤔 Mint manager address is...',
    validate: nullCheck,
  },
  {
    name: inquirerParams.airdrop_receiver_A,
    type: 'input',
    message: '🤔 Airdrop receiver address is...',
    validate: nullCheck,
  },
  {
    name: inquirerParams.quantity_to_A,
    type: 'input',
    message: '🤔 How many nfts airdrop to receiver is...',
    validate: nullCheck,
  },
  {
    name: inquirerParams.estimate_gas,
    type: 'confirm',
    message: '🤔 Just estimate gas?',
  },
];

(async () => {
  inquirer.prompt(questions).then(async (ans) => {
    try {
      const provider = await getRPCProvider(ethers.provider);
      const nftOwnerSigner = new ethers.Wallet(ans.nft_owner_private_key, provider);
      const mintManager = (await ethers.getContractFactory('OmnuumMintManager')).attach(ans.mint_manager_address);

      const value = testValues.minFee.mul(Number(ans.quantity_to_A));
      const args = [ans.nft_address, [ans.airdrop_receiver_A], [ans.quantity_to_A], { value }];

      if (ans.estimate_gas) {
        const gas = await mintManager.connect(nftOwnerSigner).estimateGas.mintMultiple(...args);
        console.log(`Gas Estimation: ${gas}`);
        return;
      }

      const txResponse = await mintManager.connect(nftOwnerSigner).mintMultiple(...args);
      console.log('txRseponse', txResponse);

      const txReceipt = await txResponse.wait();
      console.log(txReceipt);
      console.log(`💋 Air drop is on the way.\nBlock: ${txReceipt.blockNumber}\nTransaction: ${txReceipt.transactionHash}`);
    } catch (e) {
      console.error('\n 🚨 ==== ERROR ==== 🚨 \n', e);
    }
  });
})();
