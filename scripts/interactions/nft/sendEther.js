const { ethers } = require('hardhat');
const inquirer = require('inquirer');
const { nullCheck, getRPCProvider } = require('../../deployments/deployHelper');
const { queryGasDataAndProceed } = require('../../gas/queryGas');

const inquirerParams = {
  nft_contract_address: 'nft_contract_address',
  ether_sender_private_key: 'ether_sender_private_key',
  send_value: 'send_value',
};

const questions = [
  {
    name: inquirerParams.nft_contract_address,
    type: 'input',
    message: '🤔 NFT contract address is ...',
    validate: nullCheck,
  },
  {
    name: inquirerParams.ether_sender_private_key,
    type: 'input',
    message: '🤔 Ether sender private key is ...',
    validate: nullCheck,
  },
  {
    name: inquirerParams.send_value,
    type: 'input',
    message: '🤔 Amount of Ether you want to send is (in ether)...',
    validate: nullCheck,
  },
];

(async () => {
  inquirer.prompt(questions).then(async (ans) => {
    try {
      const provider = await getRPCProvider();

      const { maxFeePerGas, maxPriorityFeePerGas, proceed } = await queryGasDataAndProceed();
      if (!proceed) {
        console.log('Transaction Aborted!');
        return;
      }

      const senderSigner = new ethers.Wallet(ans.ether_sender_private_key, provider);

      const tx = await senderSigner.sendTransaction({
        to: ans.nft_contract_address,
        value: ethers.utils.parseEther(ans.send_value),
        maxFeePerGas,
        maxPriorityFeePerGas,
      });

      console.log('🔑 Transaction');
      console.dir(tx, { depth: 10 });

      const txReceipt = await tx.wait();

      console.log(txReceipt);
      console.log(`💋 Send ether to NFT Contract. \nBlock: ${txReceipt.blockNumber}\nTransaction: ${txReceipt.transactionHash}`);
    } catch (e) {
      console.error('\n 🚨 ==== ERROR ==== 🚨 \n', e);
    }
  });
})();
