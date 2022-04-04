const { ethers, config } = require('hardhat');
const { writeFile, mkdir, rm, access } = require('fs/promises');

const chalk = require('chalk');
const { deployManagers } = require('./deployments');
const {
  prev_history_file_path,
  tryCatch,
  getDateSuffix,
  structurizeProxyData,
  structurizeContractData,
  getChainName,
  getRPCProvider,
  createWalletOwnerAccounts,
} = require('./deployHelper');
const DEP_CONSTANTS = require('./deployConstants');

!(async () => {
  try {
    console.log(`
         *******   ****     **** ****     ** **     ** **     ** ****     ****
        **/////** /**/**   **/**/**/**   /**/**    /**/**    /**/**/**   **/**
       **     //**/**//** ** /**/**//**  /**/**    /**/**    /**/**//** ** /**
      /**      /**/** //***  /**/** //** /**/**    /**/**    /**/** //***  /**
      /**      /**/**  //*   /**/**  //**/**/**    /**/**    /**/**  //*   /**
      //**     ** /**   /    /**/**   //****/**    /**/**    /**/**   /    /**
       //*******  /**        /**/**    //***//******* //******* /**        /**
        ///////   //         // //      ///  ///////   ///////  //         //
    `);

    const chainName = await getChainName();

    const OmnuumDeploySigner =
      chainName === 'localhost'
        ? (await ethers.getSigners())[0]
        : await new ethers.Wallet(process.env.OMNUUM_DEPLOYER_PRIVATE_KEY, await getRPCProvider(ethers.provider));

    const walletOwnerAccounts = createWalletOwnerAccounts(
      chainName === 'localhost' ? (await ethers.getSigners()).slice(1, 6).map((x) => x.address) : DEP_CONSTANTS.wallet.ownerAddresses,
      [2, 2, 1, 1, 1],
    );

    const deployStartTime = new Date();

    console.log(`${chalk.blueBright(`START DEPLOYMENT to ${chainName} at ${deployStartTime}`)}`);

    const deploy_metadata = {
      deployer: OmnuumDeploySigner.address,
      solidity: {
        version: config.solidity.compilers[0].version,
      },
    };

    // write tmp history file for restore already deployed history
    await tryCatch(
      () => access(prev_history_file_path),
      () => writeFile(prev_history_file_path, JSON.stringify(deploy_metadata)),
    );

    const { nft, vrfManager, mintManager, caManager, exchanger, ticketManager, senderVerifier, revealManager, wallet } =
      await deployManagers({ deploySigner: OmnuumDeploySigner, walletOwnerAccounts });

    const resultData = {
      network: chainName,
      deployStartAt: deployStartTime,
      deployer: OmnuumDeploySigner.address,
      caManager: structurizeProxyData(caManager),
      mintManager: structurizeProxyData(mintManager),
      exchanger: structurizeProxyData(exchanger),
      wallet: structurizeContractData(wallet),
      ticketManager: structurizeContractData(ticketManager),
      vrfManager: structurizeContractData(vrfManager),
      revealManager: structurizeContractData(revealManager),
      senderVerifier: structurizeContractData(senderVerifier),
      nft1155: {
        impl: nft.implAddress,
        beacon: nft.beacon.address,
      },
    };

    const subgraphManifestData = {
      network: chainName,
      caManager: {
        address: caManager.proxyContract.address,
        startBlock: `${caManager.blockNumber}`,
      },
      mintManager: {
        address: mintManager.proxyContract.address,
        startBlock: `${mintManager.blockNumber}`,
      },
      ticketManager: {
        address: ticketManager.contract.address,
        startBlock: `${ticketManager.blockNumber}`,
      },
      vrfManager: {
        address: vrfManager.contract.address,
        startBlock: `${vrfManager.blockNumber}`,
      },
      wallet: {
        address: wallet.contract.address,
        startBlock: `${wallet.blockNumber}`,
      },
    };

    const filename = `${chainName}_${getDateSuffix()}.json`;

    await mkdir('./scripts/deployments/deployResults/managers', { recursive: true });
    await writeFile(`./scripts/deployments/deployResults/managers/${filename}`, Buffer.from(JSON.stringify(resultData)), 'utf8');

    await rm(prev_history_file_path); // delete tmp deploy history file

    await mkdir('./scripts/deployments/deployResults/subgraphManifest', { recursive: true });
    await writeFile(
      `./scripts/deployments/deployResults/subgraphManifest/${filename}`,
      Buffer.from(JSON.stringify(subgraphManifestData)),
      'utf-8',
    );
  } catch (e) {
    console.error('\n 🚨 ==== ERROR ==== 🚨 \n', e);
  }
})();