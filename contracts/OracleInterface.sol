pragma solidity 0.5.0;
contract OracleInterface {
    function getLatestEthPrice() public returns (uint256);
}