# This workflow will build a Node.js project and deploy it to an Azure Functions App on Windows or Linux when a commit is pushed to your default branch.
#
# This workflow assumes you have already created the target Azure Functions app.
# For instructions see:
#   - https://learn.microsoft.com/en-us/azure/azure-functions/create-first-function-vs-code-node
#   - https://learn.microsoft.com/en-us/azure/azure-functions/create-first-function-vs-code-typescript
#
# To configure this workflow:
# 1. Set up the following secrets in your repository:
#   - AZURE_FUNCTIONAPP_PUBLISH_PROFILE
# 2. Change env variables for your configuration.
#
# For more information on:
#   - GitHub Actions for Azure: https://github.com/Azure/Actions
#   - Azure Functions Action: https://github.com/Azure/functions-action
#   - Publish Profile: https://github.com/Azure/functions-action#using-publish-profile-as-deployment-credential-recommended
#   - Azure Service Principal for RBAC: https://github.com/Azure/functions-action#using-azure-service-principal-for-rbac-as-deployment-credential
#
# For more samples to get started with GitHub Action workflows to deploy to Azure: https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp

name: Deploy Node.js project to Azure Function App

on:
  push:
    branches: ["main"]

env:
  AZURE_FUNCTIONAPP_NAME: 'your-app-name'   # set this to your function app name on Azure
  AZURE_FUNCTIONAPP_PACKAGE_PATH: '.'       # set this to the path to your function app project, defaults to the repository root
  NODE_VERSION: '16.x'                      # set this to the node version to use (e.g. '8.x', '10.x', '12.x')

jobs:
  build-and-deploy:
    runs-on: windows-latest # For Linux, use ubuntu-latest
    environment: dev
    steps:
    - name: 'Checkout GitHub Action'
      uses: actions/checkout@v3

    # If you want to use Azure RBAC instead of Publish Profile, then uncomment the task below
    # - name: 'Login via Azure CLI'
    #   uses: azure/login@v1
    #   with:
    #     creds: ${{ secrets.AZURE_RBAC_CREDENTIALS }} # set up AZURE_RBAC_CREDENTIALS secrets in your repository

    - name: Setup Node ${{ env.NODE_VERSION }} Environment
      uses: actions/setup-node@v3
      with:
        node-version: ${{ env.NODE_VERSION }}

    - name: 'Resolve Project Dependencies Using Npm'
      shell: pwsh # For Linux, use bash
      run: |
        pushd './${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}'
        npm install
        npm run build --if-present
        npm run test --if-present
        popd

    - name: 'Run Azure Functions Action'
      uses: Azure/functions-action@v1
      id: fa
      with:
        app-name: ${{ env.AZURE_FUNCTIONAPP_NAME }}
        package: ${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}
        publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }} # Remove publish-profile to use Azure RBAC

// Import necessary libraries
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { RelayerAPI } from "@openzeppelin/relayer";

// Set up Relayer API
const relayer = new RelayerAPI("https://api.defender.openzeppelin.com/autotasks/7ca1e34e-4c93-4e82-a9bd-446b14dcaf60/runs/webhook/d0fb58ec-4e64-4e80-89f2-5e6672cd134e/CdGjZ1Pmq7ji3YwAuTty19");

// DApp component
const DApp = () => {
  const [provider, setProvider] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [tokenType, setTokenType] = useState("ERC20");
  const [tokenId, setTokenId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  // Initialize Ethereum provider on component mount
  useEffect(() => {
    initializeProvider();
  }, []);

  // Function to initialize Ethereum provider
  const initializeProvider = async () => {
    // Modern dapp browsers...
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);

      try {
        // Request account access if needed
        await window.ethereum.enable();
        const accounts = await provider.listAccounts();
        setAccounts(accounts);
        setSelectedAccount(accounts[0]);
      } catch (error) {
        // User denied account access...
        console.error(error);
      }
    } else {
      console.error("Please install MetaMask!");
    }
  };

  // Function to handle transfer button click
  const handleTransfer = async () => {
    if (!provider || !contractAddress || !selectedAccount) {
      console.error("Please connect MetaMask and fill in all fields!");
      return;
    }

    try {
      const signer = provider.getSigner();
      const relayerAddress = await relayer.getAddress();

      if (tokenType === "ERC20") {
        const erc20Contract = new ethers.Contract(contractAddress, erc20ABI, signer);
        const tx = await erc20Contract.transferFrom(
          selectedAccount,
          relayerAddress,
          tokenId,
          { gasPrice: 0 }
        );

        await relayer.submitAndWait(tx);
        console.log("Transfer successful!");
      } else if (tokenType === "ERC721") {
        const erc721Contract = new ethers.Contract(contractAddress, erc721ABI, signer);
        const tx = await erc721Contract["safeTransferFrom(address,address,uint256)"](
          selectedAccount,
          relayerAddress,
          tokenId,
          { gasPrice: 0 }
        );

        await relayer.submitAndWait(tx);
        console.log("Transfer successful!");
      }
    } catch (error) {
      console.error("Transfer failed:", error);
    }
  };

  return (
    <div>
      <h1>Gasless Transfer DApp</h1>

      <h3>Connect with MetaMask</h3>
      <p>
        Selected Account: {selectedAccount}
      </p>

      <h3>Transfer Tokens</h3>
      <label>
        Contract Address:
        <input
          type="text"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
        />
      </label>
      <br />
      <label>
        Token Type:
        <select value={tokenType} onChange={(e) => setTokenType(e.target.value)}>
          <option
