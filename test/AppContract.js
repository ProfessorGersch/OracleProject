const { expect } = require('chai');
const { waffle } = require("hardhat");
const { deployContract } = waffle;
const provider = waffle.provider;


// `describe` is a Mocha function that allows you to organize your test. It's
// not actually needed, but having your test organized makes debugging them
// easier. All Mocha functions are available in the global scope.

// `describe` receives the name of a section of your test suite, and a callback.
// The callback must define the test of that section. This callback can't be
// an async function.


describe("Call Oracle", function () {
    // Mocha has four functions that let you hook into the the test runner's
    // lifecyle. These are: `before`, `beforeEach`, `after`, `afterEach`.

    // They're very useful to setup the environment for test, and to clean it
    // up after they run.

    // A common pattern is to declare some variables, and assign them in the
    // `before` and `beforeEach` callbacks.

    let AppContractFactory;
    let AppInstance;
    let OracleContractFactory;
    let OracleInstance;
    let alice;
    let bob;



    // `beforeEach` will run before each test, re-deploying the contract every
    // time. It receives a callback, which can be async.

    beforeEach(async function () {
        [alice, bob] = await ethers.getSigners();
        //console.log("signers", alice.address, bob.address);
        AppContractFactory = await ethers.getContractFactory("AppContract");
        AppInstance = await AppContractFactory.deploy();
        OracleContractFactory = await ethers.getContractFactory("Oracle");
        OracleInstance = await OracleContractFactory.deploy();
    });


    describe("Application Contract should call Oracle", function () {
        it ("Should emit event when setting oracle contract address", async () => {
            await expect(AppInstance.setOracleInstanceAddress(OracleInstance.address))
                .to.emit(AppInstance,'newOracleAddressEvent')
                .withArgs(OracleInstance.address);
        })
        it("Should emit a GOT NEW REQUEST message", async () => {
            await AppInstance.setOracleInstanceAddress(OracleInstance.address);
            await expect(AppInstance.updateEthPrice())
                .to.emit(AppInstance, 'ReceivedNewRequestIdEvent')
            //.withArgs(id);
        })
    })
})
