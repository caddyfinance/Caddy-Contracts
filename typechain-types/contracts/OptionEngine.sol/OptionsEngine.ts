/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "../../common";

export interface OptionsEngineInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "COLLATERAL_RATIO"
      | "DEFAULT_ADMIN_ROLE"
      | "MAX_DURATION"
      | "MIN_DURATION"
      | "exercise"
      | "getRoleAdmin"
      | "grantRole"
      | "hasRole"
      | "lockedCollateral"
      | "openPosition"
      | "optionPosition"
      | "renounceRole"
      | "revokeRole"
      | "supportsInterface"
      | "userCollateral"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic:
      | "PositionExercised"
      | "PositionOpened"
      | "RoleAdminChanged"
      | "RoleGranted"
      | "RoleRevoked"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "COLLATERAL_RATIO",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "DEFAULT_ADMIN_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "MAX_DURATION",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "MIN_DURATION",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "exercise",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getRoleAdmin",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "grantRole",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "hasRole",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "lockedCollateral",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "openPosition",
    values: [
      AddressLike,
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BigNumberish
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "optionPosition",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "renounceRole",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "revokeRole",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "supportsInterface",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "userCollateral",
    values: [AddressLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "COLLATERAL_RATIO",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "DEFAULT_ADMIN_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "MAX_DURATION",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "MIN_DURATION",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "exercise", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getRoleAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "grantRole", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "hasRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "lockedCollateral",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "openPosition",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "optionPosition",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceRole",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "revokeRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "supportsInterface",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "userCollateral",
    data: BytesLike
  ): Result;
}

export namespace PositionExercisedEvent {
  export type InputTuple = [
    tokenId: BigNumberish,
    trader: AddressLike,
    amount: BigNumberish,
    settlementAmount: BigNumberish
  ];
  export type OutputTuple = [
    tokenId: bigint,
    trader: string,
    amount: bigint,
    settlementAmount: bigint
  ];
  export interface OutputObject {
    tokenId: bigint;
    trader: string;
    amount: bigint;
    settlementAmount: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace PositionOpenedEvent {
  export type InputTuple = [
    tokenId: BigNumberish,
    trader: AddressLike,
    premium: BigNumberish,
    isLong: boolean,
    isCall: boolean
  ];
  export type OutputTuple = [
    tokenId: bigint,
    trader: string,
    premium: bigint,
    isLong: boolean,
    isCall: boolean
  ];
  export interface OutputObject {
    tokenId: bigint;
    trader: string;
    premium: bigint;
    isLong: boolean;
    isCall: boolean;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace RoleAdminChangedEvent {
  export type InputTuple = [
    role: BytesLike,
    previousAdminRole: BytesLike,
    newAdminRole: BytesLike
  ];
  export type OutputTuple = [
    role: string,
    previousAdminRole: string,
    newAdminRole: string
  ];
  export interface OutputObject {
    role: string;
    previousAdminRole: string;
    newAdminRole: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace RoleGrantedEvent {
  export type InputTuple = [
    role: BytesLike,
    account: AddressLike,
    sender: AddressLike
  ];
  export type OutputTuple = [role: string, account: string, sender: string];
  export interface OutputObject {
    role: string;
    account: string;
    sender: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace RoleRevokedEvent {
  export type InputTuple = [
    role: BytesLike,
    account: AddressLike,
    sender: AddressLike
  ];
  export type OutputTuple = [role: string, account: string, sender: string];
  export interface OutputObject {
    role: string;
    account: string;
    sender: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface OptionsEngine extends BaseContract {
  connect(runner?: ContractRunner | null): OptionsEngine;
  waitForDeployment(): Promise<this>;

  interface: OptionsEngineInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  COLLATERAL_RATIO: TypedContractMethod<[], [bigint], "view">;

  DEFAULT_ADMIN_ROLE: TypedContractMethod<[], [string], "view">;

  MAX_DURATION: TypedContractMethod<[], [bigint], "view">;

  MIN_DURATION: TypedContractMethod<[], [bigint], "view">;

  exercise: TypedContractMethod<[tokenId: BigNumberish], [void], "payable">;

  getRoleAdmin: TypedContractMethod<[role: BytesLike], [string], "view">;

  grantRole: TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [void],
    "nonpayable"
  >;

  hasRole: TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [boolean],
    "view"
  >;

  lockedCollateral: TypedContractMethod<[arg0: BigNumberish], [bigint], "view">;

  openPosition: TypedContractMethod<
    [
      underlying: AddressLike,
      amount: BigNumberish,
      strikePrice: BigNumberish,
      expiry: BigNumberish,
      positionType: BigNumberish
    ],
    [bigint],
    "payable"
  >;

  optionPosition: TypedContractMethod<[], [string], "view">;

  renounceRole: TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [void],
    "nonpayable"
  >;

  revokeRole: TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [void],
    "nonpayable"
  >;

  supportsInterface: TypedContractMethod<
    [interfaceId: BytesLike],
    [boolean],
    "view"
  >;

  userCollateral: TypedContractMethod<[arg0: AddressLike], [bigint], "view">;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "COLLATERAL_RATIO"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "DEFAULT_ADMIN_ROLE"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "MAX_DURATION"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "MIN_DURATION"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "exercise"
  ): TypedContractMethod<[tokenId: BigNumberish], [void], "payable">;
  getFunction(
    nameOrSignature: "getRoleAdmin"
  ): TypedContractMethod<[role: BytesLike], [string], "view">;
  getFunction(
    nameOrSignature: "grantRole"
  ): TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "hasRole"
  ): TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [boolean],
    "view"
  >;
  getFunction(
    nameOrSignature: "lockedCollateral"
  ): TypedContractMethod<[arg0: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "openPosition"
  ): TypedContractMethod<
    [
      underlying: AddressLike,
      amount: BigNumberish,
      strikePrice: BigNumberish,
      expiry: BigNumberish,
      positionType: BigNumberish
    ],
    [bigint],
    "payable"
  >;
  getFunction(
    nameOrSignature: "optionPosition"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "renounceRole"
  ): TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "revokeRole"
  ): TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "supportsInterface"
  ): TypedContractMethod<[interfaceId: BytesLike], [boolean], "view">;
  getFunction(
    nameOrSignature: "userCollateral"
  ): TypedContractMethod<[arg0: AddressLike], [bigint], "view">;

  getEvent(
    key: "PositionExercised"
  ): TypedContractEvent<
    PositionExercisedEvent.InputTuple,
    PositionExercisedEvent.OutputTuple,
    PositionExercisedEvent.OutputObject
  >;
  getEvent(
    key: "PositionOpened"
  ): TypedContractEvent<
    PositionOpenedEvent.InputTuple,
    PositionOpenedEvent.OutputTuple,
    PositionOpenedEvent.OutputObject
  >;
  getEvent(
    key: "RoleAdminChanged"
  ): TypedContractEvent<
    RoleAdminChangedEvent.InputTuple,
    RoleAdminChangedEvent.OutputTuple,
    RoleAdminChangedEvent.OutputObject
  >;
  getEvent(
    key: "RoleGranted"
  ): TypedContractEvent<
    RoleGrantedEvent.InputTuple,
    RoleGrantedEvent.OutputTuple,
    RoleGrantedEvent.OutputObject
  >;
  getEvent(
    key: "RoleRevoked"
  ): TypedContractEvent<
    RoleRevokedEvent.InputTuple,
    RoleRevokedEvent.OutputTuple,
    RoleRevokedEvent.OutputObject
  >;

  filters: {
    "PositionExercised(uint256,address,uint256,uint256)": TypedContractEvent<
      PositionExercisedEvent.InputTuple,
      PositionExercisedEvent.OutputTuple,
      PositionExercisedEvent.OutputObject
    >;
    PositionExercised: TypedContractEvent<
      PositionExercisedEvent.InputTuple,
      PositionExercisedEvent.OutputTuple,
      PositionExercisedEvent.OutputObject
    >;

    "PositionOpened(uint256,address,uint256,bool,bool)": TypedContractEvent<
      PositionOpenedEvent.InputTuple,
      PositionOpenedEvent.OutputTuple,
      PositionOpenedEvent.OutputObject
    >;
    PositionOpened: TypedContractEvent<
      PositionOpenedEvent.InputTuple,
      PositionOpenedEvent.OutputTuple,
      PositionOpenedEvent.OutputObject
    >;

    "RoleAdminChanged(bytes32,bytes32,bytes32)": TypedContractEvent<
      RoleAdminChangedEvent.InputTuple,
      RoleAdminChangedEvent.OutputTuple,
      RoleAdminChangedEvent.OutputObject
    >;
    RoleAdminChanged: TypedContractEvent<
      RoleAdminChangedEvent.InputTuple,
      RoleAdminChangedEvent.OutputTuple,
      RoleAdminChangedEvent.OutputObject
    >;

    "RoleGranted(bytes32,address,address)": TypedContractEvent<
      RoleGrantedEvent.InputTuple,
      RoleGrantedEvent.OutputTuple,
      RoleGrantedEvent.OutputObject
    >;
    RoleGranted: TypedContractEvent<
      RoleGrantedEvent.InputTuple,
      RoleGrantedEvent.OutputTuple,
      RoleGrantedEvent.OutputObject
    >;

    "RoleRevoked(bytes32,address,address)": TypedContractEvent<
      RoleRevokedEvent.InputTuple,
      RoleRevokedEvent.OutputTuple,
      RoleRevokedEvent.OutputObject
    >;
    RoleRevoked: TypedContractEvent<
      RoleRevokedEvent.InputTuple,
      RoleRevokedEvent.OutputTuple,
      RoleRevokedEvent.OutputObject
    >;
  };
}
