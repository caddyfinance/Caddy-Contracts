import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { keccak256, toUtf8Bytes } from "ethers";

export default buildModule("OptionsModule", (m) => {
  // Deploy OptionPosition first
  const optionPosition = m.contract("OptionPosition");

  // Deploy OptionsEngine with OptionPosition address
  const optionsEngine = m.contract(
    "OptionsEngine",
    [optionPosition],
  );

  // Deploy MockERC20 for testing
  const mockERC20 = m.contract(
    "MockERC20",
    ["Staked Monad", "stMON"]
  );

  // Calculate MINTER_ROLE hash directly
  const MINTER_ROLE = keccak256(toUtf8Bytes("MINTER_ROLE"));

  // Grant MINTER_ROLE to OptionsEngine
  m.call(
    optionPosition,
    "grantRole",
    [MINTER_ROLE, optionsEngine]
  );

  return {
    optionPosition,
    optionsEngine,
    mockERC20,
  };
}); 