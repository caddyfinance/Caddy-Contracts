# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npm i 
npm run compile
npm run test
# npx hardhat node
npm run deploy:monad


npm run verify:monad
npm run clean
```


if you have  reconciliation issues, you can run the following command to clean the deployments folder:

```shell
rm -rf ./ignition/deployments/*

npx hardhat clean

```

then run the following command to deploy the contract:

```shell
npm run deploy:monad
```



