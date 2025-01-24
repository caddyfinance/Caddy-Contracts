// SPDX-License-Identifier: MIT
import "./interfaces/IOptionPricing.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract OptionPricing is IOptionPricing {
    using Math for uint256;
    
    uint256 private constant PRECISION = 1e18;
    
    function getOptionPrice(
        uint256 strike,
        uint256 timeToExpiry,
        uint256 volatility,
        uint256 currentPrice,
        bool isCall
    ) external pure override returns (uint256) {
        if (isCall) {
            return _calculateCallPrice(strike, timeToExpiry, volatility, currentPrice);
        } else {
            return _calculatePutPrice(strike, timeToExpiry, volatility, currentPrice);
        }
    }
    
    function _calculateCallPrice(
        uint256 strike,
        uint256 timeToExpiry,
        uint256 volatility,
        uint256 currentPrice
    ) internal pure returns (uint256) {
        // Simplified Black-Scholes implementation
        uint256 timeValue = (volatility * timeToExpiry * currentPrice) / PRECISION;
        
        if (currentPrice > strike) {
            return currentPrice - strike + timeValue;
        }
        return timeValue;
    }
    
    function _calculatePutPrice(
        uint256 strike,
        uint256 timeToExpiry,
        uint256 volatility,
        uint256 currentPrice
    ) internal pure returns (uint256) {
        uint256 timeValue = (volatility * timeToExpiry * currentPrice) / PRECISION;
        
        if (strike > currentPrice) {
            return strike - currentPrice + timeValue;
        }
        return timeValue;
    }
}
