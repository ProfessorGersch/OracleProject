const axios  = require('axios');
const ethers = require('ethers');
const OracleJSON = require('../artifacts/contracts/Oracle.sol/Oracle.json')

const SLEEP_INTERVAL        = process.env.SLEEP_INTERVAL || 2000
const CHUNK_SIZE            = process.env.CHUNK_SIZE || 3
const MAX_RETRIES           = process.env.MAX_RETRIES || 5
var pendingRequests = []



async function retrieveLatestEthPrice () {
    const resp = await axios({
        url: 'https://api.binance.com/api/v3/ticker/price',
        params: {
            symbol: 'ETHUSDT'
        },
        method: 'get'
    })
    console.log("WEB SERVICE returned Ether price: ", resp.data.price);
    return resp.data.price
}

async function filterEvents (OracleInstance) {
    OracleInstance.on('GetLatestEthPriceEvent', (caller, id) => {
        console.log("ORACLE request from", caller, "with ID", id.toString());
        pendingRequests.push({ caller, id });
    });

    OracleInstance.on('SetLatestEthPriceEvent', (price, caller) => {
        console.log("Price", price.toString(), "set for", caller);
    });
}

async function processQueue (OracleInstance) {
    //console.log("processing queue, length=", pendingRequests.length);
    let processedRequests = 0;
    while (pendingRequests.length > 0 && processedRequests < CHUNK_SIZE) {
        const req = pendingRequests.shift();
        //console.log("Req: ", req);
        await processRequest(OracleInstance, req.id, req.caller)
        processedRequests++
    }
}

async function processRequest (OracleInstance, id, caller) {
    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            const ethPrice = await retrieveLatestEthPrice();
            await setLatestEthPrice(OracleInstance, caller, ethPrice, id)
            return
        } catch (error) {
            if (retries === MAX_RETRIES - 1) {
                await setLatestEthPrice(OracleInstance, caller, '0', id)
                console.log("oops");
                return
            }
            retries++
        }
    }
}

async function setLatestEthPrice (OracleInstance, callerAddress, ethPrice, id) {
    ethPrice = ethPrice.replace('.', '');
    const multiplier = ethers.BigNumber.from(10**10);
    const ethPriceBN = ethers.BigNumber.from(ethPrice);
    const ethPriceInt = ethPriceBN.mul(multiplier);
    const idInt = ethers.BigNumber.from(id);
    try {
        await OracleInstance.setLatestEthPrice(ethPriceInt.toString(), callerAddress, idInt.toString())
    } catch (error) {
        console.log('Error encountered while calling setLatestEthPrice.')
        // Do some error handling
    }
}

async function init () {
    // get info for ganache or hardhat testnet
    const provider = await new ethers.providers.JsonRpcProvider();
    //console.log("provider", provider);

        //   the following 2 lines are used if contract is on rinkeby instead of ganache or hardhat testnet
        //let provider;
        //window.ethereum.enable().then(provider = new ethers.providers.Web3Provider(window.ethereum));

    const signer = await provider.getSigner()
    //console.log("signer", signer);
    const userAddress =  await signer.getAddress();
    //console.log("user address", userAddress);

    // initialize shadow contract

    let OracleInstance = null;
    const abi = OracleJSON.abi;
    //console.log(abi);

    // MAKE SURE YOU SET THIS CORRECTLY AFTER DEPLOYMENT OR NOTHING WILL WORK!!!!!
    OracleInstance = new ethers.Contract('0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', abi, signer);

    // listen for events
    filterEvents(OracleInstance);

    return { OracleInstance, signer }
}

(async () => {
    const { OracleInstance, signer } = await init()
    process.on( 'SIGINT', () => {
        console.log('/nUser terminated program')
        process.exit( )
    })
    setInterval(async () => {
        await processQueue(OracleInstance)
    }, SLEEP_INTERVAL)
})()