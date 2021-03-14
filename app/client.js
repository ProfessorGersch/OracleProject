const ethers = require('ethers');

const SLEEP_INTERVAL = process.env.SLEEP_INTERVAL || 2000
const AppContractJSON = require('../artifacts/contracts/AppContract.sol/AppContract.json')


// Set up event listeners.  This is how we get our data from the oracle!

async function filterEvents (AppInstance) {

    AppInstance.on('ReceivedNewRequestIdEvent', (id) => {
        console.log('request event occurred with ID number: ', id.toString());  // convert BigNumber to regular integer string
    });

    AppInstance.on('PriceUpdatedEvent', (dollarPrice) => {
        console.log('Price Updated by oracle: ', dollarPrice.toString());   // convert BigNumber to regular integer string
    });
}

// initialize connection to blockchain and wallet

async function init () {
    // get info for ganache or hardhat testnet
    const provider = await new ethers.providers.JsonRpcProvider();
    //console.log("\n\nprovider\n\n", provider);

         //   the following 2 lines are used if contract is on rinkeby instead of ganache or hardhat testnet
         //let provider;
         //window.ethereum.enable().then(provider = new ethers.providers.Web3Provider(window.ethereum));

    const signer = await provider.getSigner()
    //console.log("\n\nsigner\n\n", signer);
    const userAddress =  await signer.getAddress();
    //console.log("\n\nuser address\n\n", userAddress);

    // initialize shadow contract

    let AppInstance = null;
    // get the contract address from deployment to test network.  Make sure it is the applicaton contract, not the oracle.
    const abi = AppContractJSON.abi;

    // Make sure you set this correctly after deployment or nothing wil work!!!
    AppInstance = new ethers.Contract('0x5FbDB2315678afecb367f032d93F642f64180aa3', abi, signer);

    // listen for events
    filterEvents(AppInstance);

    return { AppInstance, signer }
}

// the main routine, written as an async so we can use await.

(async () => {

    const { AppInstance, signer  } = await init();

    process.on( 'SIGINT', () => {
        console.log('\nUser terminated program');
        process.exit( );
    })

    // Request a price update every 2 seconds
    setInterval( async () => {
        await AppInstance.updateEthPrice();
    }, SLEEP_INTERVAL);
})()