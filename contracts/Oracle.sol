pragma solidity 0.5.0;

import "hardhat/console.sol";  // for debugging
import "./AppContractInterface.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";  // to get the Ownable "onlyOwner" modifier


contract Oracle is Ownable {

    // define contract variables to be held in the blockchain
    uint private randNonce = 0;
    uint private modulus = 1000;
    mapping(uint256=>bool) pendingRequests;  // keep track of legitimate requests

    // define events

    event GetLatestEthPriceEvent(address callerAddress, uint id);
    event SetLatestEthPriceEvent(uint256 ethPrice, address callerAddress);

    // function to get the dollar price of ether from the Oracle server

    function getLatestEthPrice() public returns (uint256) {
        randNonce++;
        uint id = uint(keccak256(abi.encodePacked(now, msg.sender, randNonce))) % modulus;
        pendingRequests[id] = true;  // keep track of legitimate requests using self-generated id number
        emit GetLatestEthPriceEvent(msg.sender, id);
        // the following line demonstrates debugging a smart contract
        console.log("ORACLE: emitting request to server for ",msg.sender, " using ID ", id);
        return id;
    }

    // function called by the Oracle Server to set the requested price and return the value to the callback

    function setLatestEthPrice(uint256 _ethPrice, address _callerAddress, uint256 _id) public onlyOwner {
        require(pendingRequests[_id], "This request is not in my pending list.");
        delete pendingRequests[_id];  // once serviced, delete the request to save storage
        AppContractInterface appContractInstance;
        appContractInstance = AppContractInterface(_callerAddress);
        appContractInstance.callback(_ethPrice, _id);
        emit SetLatestEthPriceEvent(_ethPrice, _callerAddress);
    }
}
