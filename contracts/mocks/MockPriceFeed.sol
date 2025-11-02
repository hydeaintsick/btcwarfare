// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IPriceFeed.sol";

/**
 * @title MockPriceFeed
 * @dev Mock Price Feed pour les tests locaux
 */
contract MockPriceFeed is IPriceFeed {
    int256 public price;
    uint8 private _decimals;

    constructor(int256 _initialPrice, uint8 decimals_) {
        price = _initialPrice;
        _decimals = decimals_;
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (1, price, block.timestamp, block.timestamp, 1);
    }

    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function setPrice(int256 _newPrice) external {
        price = _newPrice;
    }
}

